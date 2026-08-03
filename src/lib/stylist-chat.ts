import type { ChatMessage, ClothingItem, DayPlan, FormalityId, OccasionId, Outfit } from "@/data/types";
import { getFormality, getOccasion } from "@/data/types";
import {
  buildOutfit,
  detectFormalityFromText,
  detectOccasionFromText,
  outfitPieces,
} from "@/lib/outfit-engine";
import { MIN_AI_HARMONY, scoreOutfitHarmony } from "@/lib/look-harmony";
import { extractJsonObject, geminiGenerateText, preferServerAi, resolveGeminiApiKey } from "@/lib/gemini-client";

export interface StylistReply {
  text: string;
  outfit?: Outfit;
  occasionId: OccasionId;
  formalityId: FormalityId;
}

function wardrobeDigest(wardrobe: ClothingItem[]): string {
  return wardrobe
    .filter((i) => i.status === "available")
    .slice(0, 40)
    .map(
      (i) =>
        `- ${i.id}: ${i.name} | ${i.category}/${i.subcategory} | ${i.color} (${i.colorHex || "sem hex"}) | ${i.style} | ${i.formality} | ${i.brand}`
    )
    .join("\n");
}

function resolveOutfitFromIds(
  wardrobe: ClothingItem[],
  ids: Partial<Record<keyof Outfit, string>> | undefined,
  fallback: Outfit | null
): Outfit | undefined {
  if (!ids) return fallback ?? undefined;
  const find = (id?: string) => (id && id !== "null" ? wardrobe.find((i) => i.id === id) : undefined);
  const outfit: Outfit = {
    top: find(ids.top),
    bottom: find(ids.bottom),
    dress: find(ids.dress),
    shoe: find(ids.shoe),
    bag: find(ids.bag),
    outerwear: find(ids.outerwear),
  };
  const has = outfitPieces(outfit).length > 0;
  return has ? outfit : fallback ?? undefined;
}

function outfitHarmonyOk(outfit: Outfit | undefined, occasionId: OccasionId, formalityId: FormalityId): boolean {
  if (!outfit) return false;
  const pieces = outfitPieces(outfit).map((p) => p.item);
  if (pieces.length < 2) return pieces.length === 1;
  return scoreOutfitHarmony(pieces, occasionId, formalityId) >= MIN_AI_HARMONY;
}

export async function askStylist(params: {
  userText: string;
  wardrobe: ClothingItem[];
  weekPlan: DayPlan[];
  displayName: string;
  city: string;
  styleTags: string[];
  history: ChatMessage[];
}): Promise<StylistReply> {
  const { userText, wardrobe, weekPlan, displayName, city, styleTags, history } = params;
  const today = weekPlan[0];
  const tomorrow = weekPlan[1];
  const occasionGuess = detectOccasionFromText(userText);
  const formalityGuess =
    detectFormalityFromText(userText) ?? today?.formalityId ?? getOccasion(occasionGuess).defaultFormality;
  const temp = /amanh/i.test(userText)
    ? tomorrow?.temp ?? today?.temp ?? 22
    : today?.temp ?? 22;

  const local = buildOutfit(wardrobe, occasionGuess, temp, {
    formality: formalityGuess,
    variant: Date.now() % 7,
  });

  if (!preferServerAi() && !resolveGeminiApiKey()) {
    return {
      text: local.message,
      outfit: local.outfit ?? undefined,
      occasionId: occasionGuess,
      formalityId: formalityGuess,
    };
  }

  const recent = history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "Usuária" : "Stylist"}: ${m.text}`)
    .join("\n");

  const prompt = `Você é a stylist pessoal de ${displayName || "usuária"} em ${city || "sua cidade"}.
Estilo preferido: ${styleTags.join(", ") || "não informado"}.
Clima hoje: ${today?.weather ?? "—"} ${today?.tempMax ?? "—"}°/${today?.tempMin ?? "—"}°.
Ocasião/formalidade detectadas (pode ajustar): ${getOccasion(occasionGuess).label} / ${getFormality(formalityGuess).label}.

Guarda-roupa disponível (use APENAS estes ids se sugerir peças):
${wardrobeDigest(wardrobe) || "(vazio)"}

Histórico recente:
${recent || "(novo)"}

Pedido: ${userText}

Regras de combinação (obrigatórias):
- As peças DEVEM combinar de verdade: cores em harmonia (neutros com tudo; análogas; evitar dois tons saturados que brigam).
- Estilos coerentes (não misture street esportivo com alfaiataria formal sem motivo).
- Sapato e bolsa alinhados à ocasião (ex.: academia ≠ salto; trabalho ≠ chinelo).
- Prefira pelo menos uma âncora neutra (preto, branco, bege, jeans, cinza).
- Em "text", explique em 1 frase POR QUE as peças combinam (cor/estilo), além do contexto do dia.
- Não invente ids. Prefira peças available.
- Se não fizer sentido montar look, includeOutfit=false e pieceIds vazios.

Responda SOMENTE JSON:
{
  "text": "resposta curta e útil em português (2-4 frases), incluindo por que combina",
  "occasionId": "trabalho|faculdade|encontro|festa|praia|viagem|academia|evento|casa",
  "formalityId": "casual|casual_arrumado|formal",
  "pieceIds": {
    "top": "id ou null",
    "bottom": "id ou null",
    "dress": "id ou null",
    "shoe": "id ou null",
    "bag": "id ou null",
    "outerwear": "id ou null"
  },
  "includeOutfit": true
}`;

  try {
    const raw = await geminiGenerateText(prompt, { json: true, temperature: 0.45 });
    const parsed = extractJsonObject(raw);
    const occasionId = (String(parsed.occasionId || occasionGuess) as OccasionId) || occasionGuess;
    const formalityId =
      (String(parsed.formalityId || formalityGuess) as FormalityId) || formalityGuess;
    const includeOutfit = parsed.includeOutfit !== false;
    const pieceIds = (parsed.pieceIds ?? {}) as Partial<Record<keyof Outfit, string>>;
    const rebuilt = buildOutfit(wardrobe, occasionId, temp, { formality: formalityId });
    let outfit = includeOutfit
      ? resolveOutfitFromIds(wardrobe, pieceIds, rebuilt.outfit)
      : undefined;

    // Reject low-harmony AI picks in favor of the local harmony engine
    if (includeOutfit && outfit && !outfitHarmonyOk(outfit, occasionId, formalityId)) {
      outfit = rebuilt.outfit ?? local.outfit ?? undefined;
    }

    const text =
      String(parsed.text || "").trim() ||
      rebuilt.message ||
      "Aqui está uma sugestão com base no seu guarda-roupa.";

    return { text, outfit, occasionId, formalityId };
  } catch {
    return {
      text: local.message,
      outfit: local.outfit ?? undefined,
      occasionId: occasionGuess,
      formalityId: formalityGuess,
    };
  }
}
