import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODELS = ["gemini-flash-latest", "gemini-2.0-flash-lite", "gemini-2.0-flash"];

type StoreIn = { name: string; url: string };
type QueryIn = {
  id: string;
  query: string;
  gapId: string;
  titleHint: string;
  categoryHint: string;
  subcategoryHint: string;
  formalityHint: string;
  impactPct: number;
  storeName: string;
  storeUrl: string;
};

type LiveProduct = {
  id: string;
  title: string;
  query: string;
  reason: string;
  gapId: string;
  categoryHint: string;
  subcategoryHint: string;
  formalityHint: string;
  impactPct: number;
  storeId: string;
  storeName: string;
  buyUrl: string;
  colorHint: string;
  imageUrl: string;
  price?: string;
  source: "store";
};

function hostOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json|```/gi, "").trim();
  const startObj = cleaned.indexOf("{");
  const startArr = cleaned.indexOf("[");
  const start =
    startObj >= 0 && (startArr < 0 || startObj < startArr) ? startObj : startArr;
  if (start < 0) throw new Error("NO_JSON");
  const endObj = cleaned.lastIndexOf("}");
  const endArr = cleaned.lastIndexOf("]");
  const end = Math.max(endObj, endArr);
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function callGeminiJson(prompt: string, withSearch = false): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("MISSING_API_KEY");

  let last: unknown;
  for (const model of MODELS) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;
    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    };
    if (withSearch) {
      body.tools = [{ google_search: {} }];
      // responseMimeType can conflict with tools on some models — keep text then parse
      body.generationConfig = { temperature: 0.2 };
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    if (!res.ok) {
      if (res.status === 429 || res.status === 404) {
        last = new Error(`${res.status}:${model}`);
        continue;
      }
      throw new Error(raw.slice(0, 240));
    }
    const data = JSON.parse(raw);
    const text =
      data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
      "";
    if (text) return text;
    last = new Error("EMPTY");
  }
  throw last instanceof Error ? last : new Error("FAILED");
}

async function callGemini(
  prompt: string,
  image?: { mime: string; data: string }
): Promise<string> {
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
    const text =
      data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
      "";
    if (text) return text;
    last = new Error("EMPTY");
  }
  throw last instanceof Error ? last : new Error("FAILED");
}

async function fetchOgImage(pageUrl: string): Promise<string | undefined> {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return undefined;
    const html = await res.text();
    const og =
      html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/content=["']([^"']+)["']\s+property=["']og:image["']/i)?.[1] ||
      html.match(/"image"\s*:\s*"(https?:[^"]+)"/i)?.[1];
    if (!og) return undefined;
    return og.startsWith("//") ? `https:${og}` : og;
  } catch {
    return undefined;
  }
}

async function searchSerpApi(query: string, storeUrl: string): Promise<
  { title: string; link: string; thumbnail: string; price?: string }[]
> {
  const key = Deno.env.get("SERPAPI_KEY");
  if (!key) return [];

  const host = hostOf(storeUrl);
  const storeHint = host.split(".")[0] || "";
  // site: costuma zerar resultados no Google Shopping — busca por loja no texto
  const q = storeHint ? `${query} ${storeHint}` : query;

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_shopping");
  url.searchParams.set("q", q);
  url.searchParams.set("hl", "pt-br");
  url.searchParams.set("gl", "br");
  url.searchParams.set("num", "10");
  url.searchParams.set("api_key", key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error("serpapi_http", res.status, await res.text().then((t) => t.slice(0, 200)));
    return [];
  }
  const data = await res.json();
  if (data.error) {
    console.error("serpapi_error", data.error);
    return [];
  }

  const rows = (data.shopping_results ?? []) as {
    title?: string;
    link?: string;
    product_link?: string;
    thumbnail?: string;
    source?: string;
    price?: string;
  }[];

  const mapped = rows
    .map((r) => ({
      title: r.title ?? "",
      link: r.product_link || r.link || "",
      thumbnail: r.thumbnail || "",
      price: r.price,
      source: (r.source ?? "").toLowerCase(),
    }))
    .filter((r) => r.title && r.link);

  // Preferência pela loja favorita; se não houver match, usa os primeiros resultados
  const preferred = host
    ? mapped.filter(
        (r) =>
          r.link.toLowerCase().includes(host) ||
          r.source.includes(storeHint) ||
          r.title.toLowerCase().includes(storeHint)
      )
    : mapped;

  const chosen = (preferred.length ? preferred : mapped).slice(0, 2);

  // Completa thumbnail via OG quando faltar
  const enriched = [];
  for (const item of chosen) {
    let thumbnail = item.thumbnail;
    if (!thumbnail || !/^https?:\/\//i.test(thumbnail)) {
      thumbnail = (await fetchOgImage(item.link)) ?? "";
    }
    if (!thumbnail) continue;
    enriched.push({
      title: item.title,
      link: item.link,
      thumbnail,
      price: item.price,
    });
  }
  return enriched;
}

async function searchWithGemini(
  query: string,
  store: StoreIn
): Promise<{ title: string; link: string; thumbnail: string; price?: string }[]> {
  const host = hostOf(store.url);
  const prompt = `Use Google Search. Encontre 2 produtos REAIS à venda AGORA em ${store.name} (${host || store.url}) para a busca: "${query}".

Regras:
- buyUrl deve ser o link EXATO da página do produto no site da loja (não página de busca, não google).
- imageUrl deve ser a URL EXATA da imagem do produto (cdn da loja ou thumbnail oficial).
- Não invente URLs. Se não achar, retorne lista vazia.
- Prefira produtos femininos em português do Brasil.

Responda SOMENTE JSON:
{"products":[{"title":"...","buyUrl":"https://...","imageUrl":"https://...","price":"R$ ..."}]}`;

  try {
    const text = await callGeminiJson(prompt, true);
    const parsed = extractJson(text) as {
      products?: { title?: string; buyUrl?: string; imageUrl?: string; price?: string }[];
    };
    const list = parsed.products ?? [];
    return list
      .map((p) => ({
        title: String(p.title ?? "").trim(),
        link: String(p.buyUrl ?? "").trim(),
        thumbnail: String(p.imageUrl ?? "").trim(),
        price: p.price ? String(p.price) : undefined,
      }))
      .filter((p) => p.title && /^https?:\/\//i.test(p.link))
      .slice(0, 2);
  } catch {
    return [];
  }
}

async function resolveProductsForQueries(queries: QueryIn[]): Promise<{
  products: LiveProduct[];
  meta: { hasSerpKey: boolean; queried: number };
}> {
  const hasSerpKey = Boolean(Deno.env.get("SERPAPI_KEY"));
  const out: LiveProduct[] = [];

  for (const q of queries.slice(0, 8)) {
    let hits = await searchSerpApi(q.query, q.storeUrl);
    if (!hits.length) {
      hits = await searchWithGemini(q.query, { name: q.storeName, url: q.storeUrl });
    }

    for (let i = 0; i < hits.length; i++) {
      const hit = hits[i];
      let imageUrl = hit.thumbnail;
      if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
        imageUrl = (await fetchOgImage(hit.link)) ?? "";
      }
      if (!imageUrl || !hit.link) continue;

      out.push({
        id: `${q.id}-${i}-${encodeURIComponent(hit.link).slice(0, 24)}`,
        title: hit.title,
        query: q.query,
        reason: `Encontrado em ${q.storeName}${hit.price ? ` · ${hit.price}` : ""}. Completa a lacuna do seu guarda-roupa.`,
        gapId: q.gapId,
        categoryHint: q.categoryHint,
        subcategoryHint: q.subcategoryHint,
        formalityHint: q.formalityHint,
        impactPct: q.impactPct,
        storeId: q.storeName,
        storeName: q.storeName,
        buyUrl: hit.link,
        colorHint: "",
        imageUrl,
        price: hit.price,
        source: "store",
      });
    }
  }

  return { products: out, meta: { hasSerpKey, queried: queries.length } };
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

    if (mode === "shopping") {
      const queries = (body.queries ?? []) as QueryIn[];
      const { products, meta } = await resolveProductsForQueries(queries);
      return new Response(JSON.stringify({ products, meta }), {
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
