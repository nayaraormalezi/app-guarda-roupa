import * as FileSystem from "expo-file-system/legacy";
import Constants from "expo-constants";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  COLOR_OPTIONS,
  FORMALITY_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  STYLE_OPTIONS,
  SUBCATEGORIES,
  colorHexFor,
  defaultSubcategory,
  normalizeCategory,
  normalizeFormality,
} from "@/data/catalog";
import type { Category, FormalityId } from "@/data/types";

export interface ClothingAnalysis {
  name: string;
  brand: string;
  category: Category;
  subcategory: string;
  color: string;
  colorHex: string;
  style: string;
  season: string;
  occasion: string;
  formality: FormalityId | "todos";
  confidence: "high" | "medium" | "low";
}

/** Prefer models that still have free-tier quota on this key. */
const GEMINI_MODELS = ["gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-2.0-flash"] as const;

function pickClosest(value: string | undefined, options: readonly string[], fallback: string): string {
  if (!value) return fallback;
  const exact = options.find((o) => o.toLowerCase() === value.toLowerCase());
  if (exact) return exact;
  const partial = options.find(
    (o) =>
      o.toLowerCase().includes(value.toLowerCase()) ||
      value.toLowerCase().includes(o.toLowerCase())
  );
  return partial ?? fallback;
}

function normalizeAnalysis(raw: Partial<ClothingAnalysis> & Record<string, unknown>): ClothingAnalysis {
  const category = normalizeCategory(String(raw.category ?? "superiores"));
  const subOptions = SUBCATEGORIES[category];
  const subcategory = pickClosest(String(raw.subcategory ?? ""), subOptions, defaultSubcategory(category));
  const color = pickClosest(String(raw.color ?? ""), COLOR_OPTIONS, COLOR_OPTIONS[0]);
  const style = pickClosest(String(raw.style ?? ""), STYLE_OPTIONS, STYLE_OPTIONS[1]);
  const season = pickClosest(String(raw.season ?? ""), SEASON_OPTIONS, "Todos");
  const occasion = pickClosest(String(raw.occasion ?? ""), OCCASION_OPTIONS, "Todos");
  const formality = normalizeFormality(String(raw.formality ?? "todos"));
  const name = String(raw.name ?? "").trim() || `${subcategory} ${color}`.trim();
  const brand = String(raw.brand ?? "").trim() || "Sem marca";
  const confidence =
    raw.confidence === "high" || raw.confidence === "medium" || raw.confidence === "low"
      ? raw.confidence
      : "medium";

  return {
    name,
    brand,
    category,
    subcategory,
    color,
    colorHex: colorHexFor(color),
    style,
    season,
    occasion,
    formality,
    confidence,
  };
}

function extractJson(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("Resposta da IA sem JSON");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

function buildPrompt(): string {
  const categoryList = CATEGORIES.map((c) => `${c} (${CATEGORY_LABELS[c]})`).join(", ");
  const subList = CATEGORIES.map(
    (c) => `${CATEGORY_LABELS[c]}: ${SUBCATEGORIES[c].join("|")}`
  ).join("; ");

  return `Você é um especialista em moda. Analise a foto de UMA peça de roupa/acessório e responda APENAS com JSON válido (sem markdown), neste formato:
{
  "name": "nome curto em português da peça",
  "brand": "marca se visível, senão Sem marca",
  "category": "um de: ${CATEGORIES.join("|")}",
  "subcategory": "tipo específico",
  "color": "cor principal",
  "style": "estilo",
  "season": "estação",
  "occasion": "ocasião",
  "formality": "casual|casual_arrumado|formal|todos",
  "confidence": "high|medium|low"
}

Categorias permitidas: ${categoryList}
Subcategorias por categoria: ${subList}
Cores permitidas: ${COLOR_OPTIONS.join(", ")}
Estilos permitidos: ${STYLE_OPTIONS.join(", ")}
Estações: ${SEASON_OPTIONS.join(", ")}
Ocasiões: ${OCCASION_OPTIONS.join(", ")}
Formalidade: ${FORMALITY_OPTIONS.map((f) => f.id).join(", ")}

Use apenas valores das listas. Se incerto, escolha o mais próximo e confidence "low".`;
}

export function resolveVisionApiKey(): string | undefined {
  const fromExtra = (Constants.expoConfig?.extra as { geminiApiKey?: string } | undefined)?.geminiApiKey;
  const fromEnv = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const key = (fromExtra || fromEnv)?.trim();
  return key || undefined;
}

function guessMime(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".heic") || lower.includes(".heif")) return "image/heic";
  return "image/jpeg";
}

async function callGemini(
  key: string,
  model: string,
  base64: string,
  mime: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: buildPrompt() },
            { inline_data: { mime_type: mime, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    if (res.status === 429) throw new Error(`QUOTA:${model}`);
    if (res.status === 403 || res.status === 400) throw new Error(`AUTH:${res.status}:${raw.slice(0, 160)}`);
    if (res.status === 404) throw new Error(`NOT_FOUND:${model}`);
    throw new Error(`HTTP:${res.status}:${raw.slice(0, 160)}`);
  }

  const data = JSON.parse(raw) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("EMPTY_VISION_RESPONSE");
  return text;
}

export function friendlyVisionError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === "MISSING_API_KEY") {
    return "Análise automática indisponível (chave não carregada). Reinicie o app.";
  }
  if (msg.startsWith("QUOTA:")) {
    return "Limite gratuito da IA esgotado por agora. Tente de novo em alguns minutos.";
  }
  if (msg.startsWith("AUTH:")) {
    return "Chave da IA inválida ou sem permissão.";
  }
  if (msg.includes("Network") || msg.includes("Failed to fetch") || msg.includes("network")) {
    return "Sem conexão para analisar a foto. Verifique a internet.";
  }
  return "Não foi possível analisar a foto. Preencha os campos manualmente.";
}

export async function analyzeClothingImage(imageUri: string): Promise<ClothingAnalysis> {
  const key = resolveVisionApiKey();
  if (!key) throw new Error("MISSING_API_KEY");

  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const mime = guessMime(imageUri);

  let lastError: unknown;
  for (const model of GEMINI_MODELS) {
    try {
      const text = await callGemini(key, model, base64, mime);
      return normalizeAnalysis(extractJson(text));
    } catch (e) {
      lastError = e;
      const msg = e instanceof Error ? e.message : "";
      // try next model on quota / missing model
      if (msg.startsWith("QUOTA:") || msg.startsWith("NOT_FOUND:")) continue;
      throw e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("VISION_FAILED");
}
