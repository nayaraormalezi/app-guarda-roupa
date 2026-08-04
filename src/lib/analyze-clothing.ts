import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
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
import {
  extractJsonObject,
  geminiAnalyzeImage,
  preferServerAi,
  resolveGeminiApiKey,
} from "@/lib/gemini-client";

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

/** True when server AI or a client Gemini key is available. */
export function resolveVisionApiKey(): string | undefined {
  if (preferServerAi()) return "server";
  return resolveGeminiApiKey();
}

export function friendlyVisionError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg === "MISSING_API_KEY") {
    return "Análise automática indisponível. Entre na conta ou configure a chave da IA.";
  }
  if (msg.startsWith("QUOTA:") || msg.includes("429") || /quota|resource.?exhausted|rate.?limit/i.test(msg)) {
    return "Limite do Gemini para fotos esgotado. Crie uma chave nova em aistudio.google.com/apikey (ou OpenRouter free) e envie aqui — o Groq da sua conta não analisa imagens.";
  }
  if (msg.startsWith("VISION:") || /VISION_FAILED|no_provider/i.test(msg)) {
    return "Nenhum provedor de visão disponível. Atualize a chave Gemini ou adicione OPENROUTER_API_KEY. Enquanto isso, preencha manualmente.";
  }
  if (msg.startsWith("AUTH:") || /unauthorized|401|403/i.test(msg)) {
    return "Sem permissão para analisar. Faça login na conta e tente de novo.";
  }
  if (msg.includes("Network") || msg.includes("Failed to fetch") || msg.includes("network")) {
    return "Sem conexão para analisar a foto. Verifique a internet.";
  }
  return "Não foi possível analisar a foto. Preencha os campos manualmente.";
}

async function prepareImage(imageUri: string): Promise<{ uri: string; mime: string }> {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 768 } }],
      { compress: 0.55, format: ImageManipulator.SaveFormat.JPEG }
    );
    return { uri: manipulated.uri, mime: "image/jpeg" };
  } catch {
    return { uri: imageUri, mime: "image/jpeg" };
  }
}

export async function analyzeClothingImage(imageUri: string): Promise<ClothingAnalysis> {
  if (!preferServerAi() && !resolveGeminiApiKey()) {
    throw new Error("MISSING_API_KEY");
  }

  const prepared = await prepareImage(imageUri);
  const base64 = await FileSystem.readAsStringAsync(prepared.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const text = await geminiAnalyzeImage({
    prompt: buildPrompt(),
    mime: prepared.mime,
    base64,
  });
  return normalizeAnalysis(extractJsonObject(text));
}
