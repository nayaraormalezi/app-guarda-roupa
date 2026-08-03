import Constants from "expo-constants";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-2.0-flash"] as const;

export function resolveGeminiApiKey(): string | undefined {
  const fromExtra = (Constants.expoConfig?.extra as { geminiApiKey?: string } | undefined)?.geminiApiKey;
  const fromEnv = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  return (fromExtra || fromEnv)?.trim() || undefined;
}

export function preferServerAi(): boolean {
  const extra = Constants.expoConfig?.extra as { useServerAi?: boolean } | undefined;
  if (extra?.useServerAi === false) return false;
  return isSupabaseConfigured();
}

async function viaEdgeFunction(body: Record<string, unknown>): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("NO_SUPABASE");
  const { data, error } = await supabase.functions.invoke("ai", { body });
  if (error) throw error;
  const text = (data as { text?: string; error?: string } | null)?.text;
  if ((data as { error?: string } | null)?.error) {
    throw new Error(String((data as { error: string }).error));
  }
  if (!text) throw new Error("EMPTY_RESPONSE");
  return text;
}

async function viaClientKey(
  prompt: string,
  options?: { json?: boolean; temperature?: number; image?: { mime: string; data: string } }
): Promise<string> {
  const key = resolveGeminiApiKey();
  if (!key) throw new Error("MISSING_API_KEY");

  let lastError: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      const parts: Record<string, unknown>[] = [{ text: prompt }];
      if (options?.image) {
        parts.push({
          inline_data: { mime_type: options.image.mime, data: options.image.data },
        });
      }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: options?.temperature ?? 0.4,
            ...(options?.json ? { responseMimeType: "application/json" } : {}),
          },
        }),
      });
      const raw = await res.text();
      if (!res.ok) {
        if (res.status === 429) {
          lastError = new Error(`QUOTA:${model}`);
          continue;
        }
        if (res.status === 404) {
          lastError = new Error(`NOT_FOUND:${model}`);
          continue;
        }
        throw new Error(`HTTP:${res.status}:${raw.slice(0, 160)}`);
      }
      const data = JSON.parse(raw) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text) throw new Error("EMPTY_RESPONSE");
      return text;
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : "";
      if (msg.startsWith("QUOTA:") || msg.startsWith("NOT_FOUND:")) continue;
      throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("GEMINI_FAILED");
}

export async function geminiGenerateText(
  prompt: string,
  options?: { json?: boolean; temperature?: number }
): Promise<string> {
  if (preferServerAi()) {
    try {
      return await viaEdgeFunction({ mode: "stylist", prompt });
    } catch {
      // fall through to client key for local/dev
    }
  }
  return viaClientKey(prompt, options);
}

export async function geminiAnalyzeImage(params: {
  prompt: string;
  mime: string;
  base64: string;
}): Promise<string> {
  if (preferServerAi()) {
    try {
      return await viaEdgeFunction({
        mode: "analyze",
        prompt: params.prompt,
        mime: params.mime,
        imageBase64: params.base64,
      });
    } catch {
      // fall through
    }
  }
  return viaClientKey(params.prompt, {
    json: true,
    temperature: 0.2,
    image: { mime: params.mime, data: params.base64 },
  });
}

export function extractJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("NO_JSON");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}
