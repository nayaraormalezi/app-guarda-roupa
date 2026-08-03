import type { ClothingItem, FormalityId, OccasionId, Outfit } from "@/data/types";
import {
  FORMALITIES,
  getFormality,
  getOccasion,
  normalizeFormalityId,
  normalizeOccasionId,
  OCCASIONS,
} from "@/data/types";
import { normalizeFormality } from "@/data/catalog";
import {
  describeHarmony,
  scoreItemAgainstOutfit,
  scoreOutfitHarmony,
} from "@/lib/look-harmony";

function available(items: ClothingItem[]) {
  return items.filter((i) => i.status === "available");
}

function byCategory(items: ClothingItem[], category: ClothingItem["category"]) {
  return available(items).filter((i) => i.category === category);
}

function inferFormality(item: ClothingItem): FormalityId | "todos" {
  const stored = normalizeFormality(item.formality);
  if (stored !== "todos") return stored;

  const blob = `${item.style} ${item.subcategory} ${item.occasion}`.toLowerCase();
  if (/formal|clássico|classico|elegante|oxford|salto|blazer|alfaiat/i.test(blob)) return "formal";
  if (/business|corporativ|minimalista|casual elegante|camisa|calça|calca/i.test(blob)) {
    return "casual_arrumado";
  }
  if (/jeans|tênis|tenis|street|esport|casual|boho|cropped/i.test(blob)) return "casual";
  return "todos";
}

function scoreItem(
  item: ClothingItem,
  occasionId: OccasionId,
  formalityId: FormalityId,
  temp?: number
): number {
  let score = item.uses * 0.05;
  const occ = getOccasion(occasionId);
  const label = occ.label.toLowerCase();
  const itemOcc = item.occasion.toLowerCase();

  if (itemOcc === "todos" || itemOcc.includes(label)) {
    score += 6;
  }
  if (occasionId === "trabalho" && /trabalho|todos/i.test(item.occasion)) score += 4;
  if (occasionId === "faculdade" && /faculdade|casual|todos|social/i.test(item.occasion)) score += 4;
  if (occasionId === "praia" && /praia|lazer|casual|todos/i.test(item.occasion)) score += 5;
  if (occasionId === "academia" && /academia|esporte|casual|todos/i.test(item.occasion)) score += 6;
  if (occasionId === "festa" && /festa|social|evento|todos/i.test(item.occasion)) score += 5;
  if (occasionId === "evento" && /evento|social|todos/i.test(item.occasion)) score += 5;
  if (occasionId === "casa" && /casa|casual|todos/i.test(item.occasion)) score += 4;
  if (occasionId === "encontro" && /encontro|social|todos/i.test(item.occasion)) score += 4;

  const itemFormality = inferFormality(item);
  if (itemFormality === "todos" || itemFormality === formalityId) {
    score += 10;
  } else if (
    (formalityId === "casual_arrumado" &&
      (itemFormality === "formal" || itemFormality === "casual")) ||
    (formalityId === "formal" && itemFormality === "casual_arrumado")
  ) {
    score += 2;
  } else {
    score -= 8;
  }

  if (formalityId === "formal") {
    if (/clássico|elegante|business|minimalista/i.test(item.style)) score += 6;
    if (/blazer|camisa|calça|oxford|salto/i.test(`${item.subcategory} ${item.style}`)) score += 4;
    if (/tênis|jeans|street|cropped|bermuda|shorts/i.test(`${item.subcategory} ${item.style}`)) {
      score -= 7;
    }
  } else if (formalityId === "casual_arrumado") {
    if (/business|casual elegante|minimalista|clássico/i.test(item.style)) score += 7;
    if (/blazer|camisa|calça|mule|loafer|trench/i.test(item.subcategory)) score += 4;
    if (/jeans/i.test(item.subcategory)) score += 1;
    if (/streetwear|boho|regata/i.test(`${item.style} ${item.subcategory}`)) score -= 4;
  } else {
    if (/casual|street|esport|romant|boho/i.test(item.style)) score += 6;
    if (/tênis|jeans|camiseta|shorts|rasteira/i.test(item.subcategory)) score += 4;
    if (/blazer|oxford|alfaiat/i.test(`${item.subcategory} ${item.style}`)) score -= 3;
  }

  if (occasionId === "praia" && /verão/i.test(item.season)) score += 4;
  if (occasionId === "academia" && /legging|tênis|esport/i.test(`${item.subcategory} ${item.style}`)) {
    score += 8;
  }
  if (temp !== undefined) {
    if (temp < 18 && item.category === "casacos") score += 4;
    if (temp > 26 && /verão/i.test(item.season)) score += 3;
    if (temp > 26 && item.category === "casacos") score -= 3;
  }

  return score;
}

function rankItems(
  items: ClothingItem[],
  occasionId: OccasionId,
  formalityId: FormalityId,
  temp?: number,
  excludeIds: string[] = []
): ClothingItem[] {
  const excluded = new Set(excludeIds);
  const preferred = items.filter((i) => !excluded.has(i.id));
  const pool = preferred.length ? preferred : items;
  return [...pool].sort(
    (a, b) =>
      scoreItem(b, occasionId, formalityId, temp) - scoreItem(a, occasionId, formalityId, temp)
  );
}

const SHORTLIST = 6;
/** Harmony is scaled higher so visual match beats weak context ties */
const HARMONY_WEIGHT = 1.35;

function shortlist(
  items: ClothingItem[],
  occasionId: OccasionId,
  formalityId: FormalityId,
  temp: number | undefined,
  excludeIds: string[],
  limit = SHORTLIST
): ClothingItem[] {
  return rankItems(items, occasionId, formalityId, temp, excludeIds).slice(0, limit);
}

function contextSum(
  pieces: ClothingItem[],
  occasionId: OccasionId,
  formalityId: FormalityId,
  temp?: number
): number {
  return pieces.reduce((s, p) => s + scoreItem(p, occasionId, formalityId, temp), 0);
}

function outfitList(outfit: Outfit): ClothingItem[] {
  return [outfit.dress, outfit.top, outfit.bottom, outfit.shoe, outfit.bag, outfit.outerwear].filter(
    (p): p is ClothingItem => Boolean(p)
  );
}

function scoreCombo(
  outfit: Outfit,
  occasionId: OccasionId,
  formalityId: FormalityId,
  temp?: number
): number {
  const pieces = outfitList(outfit);
  if (!pieces.length) return -Infinity;
  return (
    contextSum(pieces, occasionId, formalityId, temp) +
    scoreOutfitHarmony(pieces, occasionId, formalityId) * HARMONY_WEIGHT
  );
}

function wantOuterwear(
  temp: number | undefined,
  formality: FormalityId,
  variant: number
): boolean {
  return (
    (temp !== undefined && temp < 20) ||
    formality === "formal" ||
    (formality === "casual_arrumado" && variant % 2 === 0)
  );
}

function buildCandidates(params: {
  tops: ClothingItem[];
  bottoms: ClothingItem[];
  dresses: ClothingItem[];
  shoes: ClothingItem[];
  bags: ClothingItem[];
  outerwear: ClothingItem[];
  useDress: boolean;
  includeOuter: boolean;
  occasion: OccasionId;
  formality: FormalityId;
  temp?: number;
  excludeIds: string[];
}): Outfit[] {
  const {
    tops,
    bottoms,
    dresses,
    shoes,
    bags,
    outerwear,
    useDress,
    includeOuter,
    occasion,
    formality,
    temp,
    excludeIds,
  } = params;

  const topSL = shortlist(tops, occasion, formality, temp, excludeIds);
  const bottomSL = shortlist(bottoms, occasion, formality, temp, excludeIds);
  const dressSL = shortlist(dresses, occasion, formality, temp, excludeIds);
  const shoeSL = shortlist(shoes, occasion, formality, temp, excludeIds, 5);
  const bagSL = shortlist(bags, occasion, formality, temp, excludeIds, 4);
  const outerSL = includeOuter
    ? shortlist(outerwear, occasion, formality, temp, excludeIds, 4)
    : [];

  const shoeOpts: (ClothingItem | undefined)[] = shoeSL.length ? shoeSL : [undefined];
  const bagOpts: (ClothingItem | undefined)[] = bagSL.length ? [...bagSL, undefined] : [undefined];
  const outerOpts: (ClothingItem | undefined)[] = includeOuter
    ? outerSL.length
      ? outerSL
      : [undefined]
    : [undefined];

  const candidates: Outfit[] = [];
  const push = (o: Outfit) => {
    candidates.push(o);
  };

  if (useDress && dressSL.length) {
    for (const dress of dressSL) {
      for (const shoe of shoeOpts) {
        for (const bag of bagOpts.slice(0, 3)) {
          for (const outer of outerOpts.slice(0, 3)) {
            push({
              dress,
              shoe: shoe ?? undefined,
              bag: bag ?? undefined,
              outerwear: outer ?? undefined,
            });
          }
        }
      }
    }
  } else {
    const tOpts = topSL.length ? topSL : [undefined];
    const bOpts = bottomSL.length ? bottomSL : [undefined];
    for (const top of tOpts) {
      for (const bottom of bOpts) {
        if (!top && !bottom) continue;
        for (const shoe of shoeOpts) {
          for (const bag of bagOpts.slice(0, 3)) {
            for (const outer of outerOpts.slice(0, 3)) {
              push({
                top: top ?? undefined,
                bottom: bottom ?? undefined,
                shoe: shoe ?? undefined,
                bag: bag ?? undefined,
                outerwear: outer ?? undefined,
              });
            }
          }
        }
      }
    }
  }

  // Cap explosion: keep best by quick score if too many
  if (candidates.length > 400) {
    return candidates
      .map((o) => ({ o, s: scoreCombo(o, occasion, formality, temp) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 400)
      .map((x) => x.o);
  }
  return candidates;
}

export interface OutfitBuildOptions {
  variant?: number;
  excludeIds?: string[];
  formality?: FormalityId;
}

export interface OutfitResult {
  outfit: Outfit | null;
  message: string;
  missing: string[];
  harmonyScore?: number;
}

export function buildOutfit(
  wardrobe: ClothingItem[],
  occasionId: OccasionId,
  temp?: number,
  options: OutfitBuildOptions = {}
): OutfitResult {
  const occasion = normalizeOccasionId(occasionId);
  const formality = normalizeFormalityId(
    options.formality ?? getOccasion(occasion).defaultFormality
  );
  const variant = options.variant ?? 0;
  const excludeIds = options.excludeIds ?? [];

  const tops = byCategory(wardrobe, "superiores");
  const bottoms = byCategory(wardrobe, "inferiores");
  const dresses = [...byCategory(wardrobe, "vestidos"), ...byCategory(wardrobe, "macacoes")];
  const shoes = byCategory(wardrobe, "sapatos");
  const bags = byCategory(wardrobe, "bolsas");
  const outerwear = byCategory(wardrobe, "casacos");

  const dressFriendly =
    occasion === "evento" || occasion === "encontro" || occasion === "festa" || occasion === "praia";
  const preferDress =
    dresses.length > 0 &&
    formality !== "formal" &&
    (dressFriendly ? variant % 3 !== 1 : variant % 4 === 3);

  const includeOuter = wantOuterwear(temp, formality, variant);
  const missing: string[] = [];

  const tryDress = preferDress || (!tops.length && !bottoms.length && dresses.length > 0);
  let candidates = buildCandidates({
    tops,
    bottoms,
    dresses,
    shoes,
    bags,
    outerwear,
    useDress: tryDress,
    includeOuter,
    occasion,
    formality,
    temp,
    excludeIds,
  });

  // If dress path empty, fall back to separates
  if (!candidates.length && tryDress) {
    candidates = buildCandidates({
      tops,
      bottoms,
      dresses,
      shoes,
      bags,
      outerwear,
      useDress: false,
      includeOuter,
      occasion,
      formality,
      temp,
      excludeIds,
    });
  }

  if (!tops.length && !tryDress) missing.push("peça superior");
  if (!bottoms.length && !tryDress) missing.push("calça ou saia");
  if (!shoes.length) missing.push("sapato");

  if (!candidates.length) {
    return {
      outfit: null,
      message: `Não consegui montar um look completo. Faltam: ${
        missing.length ? missing.join(", ") : "peças disponíveis"
      }. Adicione peças no guarda-roupa.`,
      missing,
    };
  }

  const ranked = candidates
    .map((outfit) => ({
      outfit,
      score: scoreCombo(outfit, occasion, formality, temp),
      harmony: scoreOutfitHarmony(outfitList(outfit), occasion, formality),
    }))
    .sort((a, b) => b.score - a.score);

  const pick = ranked[Math.abs(variant) % ranked.length];
  const outfit = pick.outfit;
  const pieces = outfitList(outfit);

  if (missing.length && !outfit.dress && !outfit.top) {
    return {
      outfit: null,
      message: `Não consegui montar um look completo. Faltam: ${missing.join(", ")}. Adicione peças no guarda-roupa.`,
      missing,
    };
  }

  const occ = getOccasion(occasion);
  const form = getFormality(formality);
  const why = describeHarmony(pieces);

  return {
    outfit,
    message: `Para ${occ.label} · ${form.label.toLowerCase()}${
      temp !== undefined ? ` · ${temp}°` : ""
    }: ${why}.`,
    missing,
    harmonyScore: pick.harmony,
  };
}

export type OutfitSlot = "top" | "bottom" | "dress" | "shoe" | "bag" | "outerwear";

const SLOT_CATEGORY: Record<OutfitSlot, ClothingItem["category"][]> = {
  top: ["superiores"],
  bottom: ["inferiores"],
  dress: ["vestidos", "macacoes"],
  shoe: ["sapatos"],
  bag: ["bolsas"],
  outerwear: ["casacos"],
};

export function alternativesForSlot(
  wardrobe: ClothingItem[],
  slot: OutfitSlot,
  occasionId: OccasionId,
  formalityId: FormalityId,
  temp?: number,
  currentId?: string,
  currentOutfit?: Outfit
): ClothingItem[] {
  const cats = new Set(SLOT_CATEGORY[slot]);
  const occasion = normalizeOccasionId(occasionId);
  const pool = available(wardrobe).filter((i) => cats.has(i.category) && i.id !== currentId);

  return [...pool]
    .sort((a, b) => {
      const ctxA = scoreItem(a, occasion, formalityId, temp);
      const ctxB = scoreItem(b, occasion, formalityId, temp);
      const harmA = currentOutfit
        ? scoreItemAgainstOutfit(a, currentOutfit, occasion, formalityId, slot)
        : 0;
      const harmB = currentOutfit
        ? scoreItemAgainstOutfit(b, currentOutfit, occasion, formalityId, slot)
        : 0;
      return ctxB + harmB * HARMONY_WEIGHT - (ctxA + harmA * HARMONY_WEIGHT);
    })
    .slice(0, 8);
}

export function swapOutfitSlot(
  outfit: Outfit,
  slot: OutfitSlot,
  next: ClothingItem
): Outfit {
  const copy: Outfit = { ...outfit, [slot]: next };
  if (slot === "dress") {
    delete copy.top;
    delete copy.bottom;
  }
  if (slot === "top" || slot === "bottom") {
    delete copy.dress;
  }
  return copy;
}

export function detectOccasionFromText(text: string): OccasionId {
  const lower = text.toLowerCase();
  for (const occ of OCCASIONS) {
    if (occ.keywords.some((k) => lower.includes(k))) return occ.id;
  }
  return "casa";
}

export function detectFormalityFromText(text: string): FormalityId | undefined {
  const lower = text.toLowerCase();
  if (/formal|casamento|alfaiat|gravata/i.test(lower)) return "formal";
  if (
    /casual arrumado|arrumado|business casual|semi.?formal|não tão formal|nao tao formal|corporativ/i.test(
      lower
    )
  ) {
    return "casual_arrumado";
  }
  if (/informal|descontra|casual|jeans|confort/i.test(lower)) return "casual";
  return undefined;
}

export function outfitPieces(outfit: Outfit): { label: string; item: ClothingItem }[] {
  const rows: { label: string; item: ClothingItem }[] = [];
  if (outfit.dress) {
    rows.push({
      label: outfit.dress.category === "macacoes" ? "Macacão" : "Vestido",
      item: outfit.dress,
    });
  }
  if (outfit.top) rows.push({ label: "Superior", item: outfit.top });
  if (outfit.bottom) rows.push({ label: "Inferior", item: outfit.bottom });
  if (outfit.outerwear) rows.push({ label: "Casaco", item: outfit.outerwear });
  if (outfit.shoe) rows.push({ label: "Sapato", item: outfit.shoe });
  if (outfit.bag) rows.push({ label: "Bolsa", item: outfit.bag });
  return rows;
}

export function outfitPieceIds(outfit: Outfit): string[] {
  return outfitPieces(outfit).map((p) => p.item.id);
}

export function slotLabel(slot: OutfitSlot): string {
  const map: Record<OutfitSlot, string> = {
    top: "Superior",
    bottom: "Inferior",
    dress: "Vestido",
    shoe: "Sapato",
    bag: "Bolsa",
    outerwear: "Casaco",
  };
  return map[slot];
}

export function countCombinations(wardrobe: ClothingItem[]): number {
  const a = available(wardrobe);
  const tops = a.filter((i) => i.category === "superiores").length;
  const bottoms = a.filter((i) => i.category === "inferiores").length;
  const dresses = a.filter((i) => i.category === "vestidos" || i.category === "macacoes").length;
  const shoes = Math.max(1, a.filter((i) => i.category === "sapatos").length);
  return tops * bottoms * shoes + dresses * shoes;
}

export interface WardrobeGap {
  id: string;
  label: string;
  reason: string;
  have: number;
  need: number;
  categoryHint: ClothingItem["category"];
  subcategoryHint: string;
  formalityHint: FormalityId | "todos";
  impactPct: number;
}

export function wardrobeGaps(wardrobe: ClothingItem[]): WardrobeGap[] {
  const a = available(wardrobe);
  const count = (pred: (i: ClothingItem) => boolean) => a.filter(pred).length;
  const gaps: WardrobeGap[] = [
    {
      id: "blazers",
      label: "Blazer estruturado",
      reason: "Fecha looks de trabalho e eventos com poucas peças",
      have: count((i) => /blazer/i.test(i.subcategory)),
      need: 2,
      categoryHint: "casacos",
      subcategoryHint: "Blazer",
      formalityHint: "casual_arrumado",
      impactPct: 28,
    },
    {
      id: "formal-shoes",
      label: "Sapato formal",
      reason: "Falta base para formalidade alta e eventos",
      have: count(
        (i) =>
          i.category === "sapatos" &&
          /salto|clássico|formal|oxford|mule|loafer/i.test(`${i.subcategory} ${i.style}`)
      ),
      need: 3,
      categoryHint: "sapatos",
      subcategoryHint: "Salto / Oxford",
      formalityHint: "formal",
      impactPct: 22,
    },
    {
      id: "neutral-tops",
      label: "Superior neutro",
      reason: "Bases neutras multiplicam combinações do closet",
      have: count(
        (i) =>
          i.category === "superiores" &&
          /branco|preto|bege|nude|off|creme|cinza/i.test(i.color)
      ),
      need: 4,
      categoryHint: "superiores",
      subcategoryHint: "Camisa / Blusa",
      formalityHint: "casual_arrumado",
      impactPct: 31,
    },
    {
      id: "bottoms",
      label: "Calça ou saia versátil",
      reason: "Poucos inferiores limitam looks para trabalho e faculdade",
      have: count((i) => i.category === "inferiores"),
      need: 4,
      categoryHint: "inferiores",
      subcategoryHint: "Calça / Saia",
      formalityHint: "casual_arrumado",
      impactPct: 25,
    },
    {
      id: "outerwear",
      label: "Casaco leve",
      reason: "Útil em dias frescos e looks casual arrumado",
      have: count((i) => i.category === "casacos"),
      need: 2,
      categoryHint: "casacos",
      subcategoryHint: "Trench / Cardigan",
      formalityHint: "casual",
      impactPct: 18,
    },
  ];
  return gaps.filter((g) => g.have < g.need).sort((a, b) => b.impactPct - a.impactPct);
}

export { FORMALITIES };
