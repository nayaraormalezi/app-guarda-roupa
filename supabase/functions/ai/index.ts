import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODELS = ["gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-2.0-flash"];

async function callGemini(prompt: string, image?: { mime: string; data: string }) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("MISSING_API_KEY");

  let last: unknown;
  for (const model of MODELS) {
    const parts: Record<string, unknown>[] = [{ text: prompt }];
    if (image) {
      parts.push({ inline_data: { mime_type: image.mime, data: image.data } });
    }
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: image ? 0.2 : 0.5,
          responseMimeType: "application/json",
        },
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      if (res.status === 429 || res.status === 404) {
        last = new Error(`${res.status}:${model}`);
        continue;
      }
      throw new Error(raw.slice(0, 200));
    }
    const data = JSON.parse(raw);
    const text = data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    if (text) return text;
    last = new Error("EMPTY");
  }
  throw last instanceof Error ? last : new Error("FAILED");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const mode = body.mode as string;

    if (mode === "analyze") {
      const prompt = body.prompt as string;
      const mime = (body.mime as string) || "image/jpeg";
      const data = body.imageBase64 as string;
      const text = await callGemini(prompt, { mime, data });
      return new Response(JSON.stringify({ text }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (mode === "stylist") {
      const prompt = body.prompt as string;
      const text = await callGemini(prompt);
      return new Response(JSON.stringify({ text }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown_mode" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
