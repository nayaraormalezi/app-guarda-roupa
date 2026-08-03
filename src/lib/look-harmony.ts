import type { ClothingItem, FormalityId, OccasionId, Outfit } from "@/data/types";

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const NAME_TO_HEX: Record<string, string> = {
  preto: "#1a1a1a",
  black: "#1a1a1a",
  branco: "#f5f5f5",
  white: "#f5f5f5",
  off: "#f0ebe3",
  offwhite: "#f0ebe3",
  creme: "#f5e6d3",
  cream: "#f5e6d3",
  bege: "#d4c4a8",
  beige: "#d4c4a8",
  nude: "#e8d5c4",
  cinza: "#8a8a8a",
  gray: "#8a8a8a",
  grey: "#8a8a8a",
  jeans: "#4a6fa5",
  denim: "#4a6fa5",
  azul: "#2f5aa8",
  blue: "#2f5aa8",
  marinho: "#1b2a4a",
  navy: "#1b2a4a",
  vermelho: "#c0392b",
  red: "#c0392b",
  rosa: "#e8a0bf",
  pink: "#e8a0bf",
  verde: "#2d6a4f",
  green: "#2d6a4f",
  amarelo: "#e6b422",
  yellow: "#e6b422",
  laranja: "#e67e22",
  orange: "#e67e22",
  roxo: "#6c3483",
  purple: "#6c3483",
  marrom: "#6b4423",
  brown: "#6b4423",
  caramelo: "#c68642",
  camel: "#c68642",
  bordô: "#6b1e2a",
  bordo: "#6b1e2a",
  burgundy: "#6b1e2a",
  vinho: "#6b1e2a",
  mostarda: "#c9a227",
  teal: "#1a7a6d",
  turquesa: "#1abc9c",
  khaki: "#b7a878",
  cáqui: "#b7a878",
  caqui: "#b7a878",
  olive: "#556b2f",
  oliva: "#556b2f",
  prata: "#c0c0c0",
  silver: "#c0c0c0",
  dourado: "#c9a84c",
  gold: "#c9a84c",
};

function normalizeHex(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withHash = t.startsWith("#") ? t : `#${t}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const r = withHash[1];
    const g = withHash[2];
    const b = withHash[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

export function hexToHsl(hex: string): Hsl | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const r = parseInt(normalized.slice(1, 3), 16) / 255;
  const g = parseInt(normalized.slice(3, 5), 16) / 255;
  const b = parseInt(normalized.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function colorFromName(name: string): string | null {
  const key = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
  if (!key) return null;
  for (const [k, hex] of Object.entries(NAME_TO_HEX)) {
    const nk = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (key.includes(nk) || nk.includes(key)) return hex;
  }
  return null;
}

export function resolveItemHsl(item: ClothingItem): Hsl | null {
  const fromHex = hexToHsl(item.colorHex);
  if (fromHex) return fromHex;
  const named = colorFromName(item.color);
  return named ? hexToHsl(named) : null;
}

export function isNeutral(item: ClothingItem, hsl?: Hsl | null): boolean {
  const blob = `${item.color} ${item.subcategory}`.toLowerCase();
  if (/preto|branco|cinza|bege|nude|creme|off|jeans|denim|marrom|camel|caramelo|khaki|cáqui|caqui|prata|dourado|gray|grey|black|white|beige|brown/i.test(blob)) {
    return true;
  }
  const c = hsl ?? resolveItemHsl(item);
  if (!c) return false;
  return c.s < 0.18 || c.l < 0.12 || c.l > 0.88;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/** Color harmony between two pieces. Range roughly -12 .. +14 */
export function scorePairColor(a: ClothingItem, b: ClothingItem): number {
  const ha = resolveItemHsl(a);
  const hb = resolveItemHsl(b);
  const na = isNeutral(a, ha);
  const nb = isNeutral(b, hb);

  if (na && nb) return 8;
  if (na || nb) return 10;

  if (!ha || !hb) {
    // Same color name fallback
    if (a.color && b.color && a.color.toLowerCase() === b.color.toLowerCase()) return 9;
    return 2;
  }

  const dist = hueDistance(ha.h, hb.h);
  const satGap = Math.abs(ha.s - hb.s);
  const lightGap = Math.abs(ha.l - hb.l);

  // Same / analogous
  if (dist <= 25) return 12 + (lightGap > 0.15 ? 2 : 0);
  // Analogous
  if (dist <= 45) return 9;
  // Complementary
  if (dist >= 150 && dist <= 210) return lightGap > 0.1 || satGap > 0.1 ? 7 : 4;
  // Triadic-ish
  if (dist >= 100 && dist <= 140) return 5;
  // Clash: high-sat distant hues
  if (dist > 60 && ha.s > 0.45 && hb.s > 0.45 && lightGap < 0.2) return -10;
  if (dist > 80 && ha.s > 0.35 && hb.s > 0.35) return -6;
  return 1;
}

function styleFamily(style: string): string {
  const s = style.toLowerCase();
  if (/street|esport|sport|athleisure/i.test(s)) return "street";
  if (/boho|romant|vintage|retrô|retro/i.test(s)) return "boho";
  if (/clássico|classico|elegante|formal|alfaiat|business|minimal/i.test(s)) return "classic";
  if (/casual elegante|smart/i.test(s)) return "smart";
  if (/casual/i.test(s)) return "casual";
  return "other";
}

/** Style coherence. Range roughly -8 .. +8 */
export function scorePairStyle(a: ClothingItem, b: ClothingItem): number {
  const fa = styleFamily(a.style);
  const fb = styleFamily(b.style);
  if (fa === fb) return 8;
  if (
    (fa === "classic" && fb === "smart") ||
    (fa === "smart" && fb === "classic") ||
    (fa === "casual" && fb === "smart") ||
    (fa === "smart" && fb === "casual") ||
    (fa === "casual" && fb === "street") ||
    (fa === "street" && fb === "casual")
  ) {
    return 4;
  }
  if (
    (fa === "street" && fb === "classic") ||
    (fa === "classic" && fb === "street") ||
    (fa === "boho" && fb === "classic") ||
    (fa === "classic" && fb === "boho")
  ) {
    return -6;
  }
  if (fa === "other" || fb === "other") return 2;
  return 0;
}

function blobOf(item: ClothingItem): string {
  return `${item.subcategory} ${item.style} ${item.name}`.toLowerCase();
}

function isAthletic(item: ClothingItem): boolean {
  return /legging|tênis|tenis|esport|academia|sport|sneaker/i.test(blobOf(item));
}

function isHeel(item: ClothingItem): boolean {
  return /salto|heel|stiletto/i.test(blobOf(item));
}

function isFlipFlop(item: ClothingItem): boolean {
  return /chinelo|havaiana|flip|rasteira|sandália rasteira/i.test(blobOf(item));
}

function isDressShoe(item: ClothingItem): boolean {
  return /oxford|loafer|mule|scarpin|sapato social|derby/i.test(blobOf(item));
}

/** Silhouette / occasion fit for the whole set */
export function scoreSilhouette(
  pieces: ClothingItem[],
  occasionId: OccasionId,
  formalityId: FormalityId
): number {
  let score = 0;
  const shoes = pieces.find((p) => p.category === "sapatos");
  const hasAthletic = pieces.some(isAthletic);
  const hasHeel = shoes ? isHeel(shoes) : false;
  const hasFlip = shoes ? isFlipFlop(shoes) : false;
  const hasDressShoe = shoes ? isDressShoe(shoes) : false;

  if (occasionId === "academia") {
    if (hasAthletic) score += 10;
    if (hasHeel || hasDressShoe) score -= 12;
  }
  if (occasionId === "trabalho" || occasionId === "evento") {
    if (hasFlip) score -= 14;
    if (formalityId === "formal" && (hasHeel || hasDressShoe)) score += 8;
    if (formalityId === "formal" && shoes && /tênis|tenis/i.test(blobOf(shoes))) score -= 10;
  }
  if (occasionId === "festa" || occasionId === "encontro") {
    if (hasHeel) score += 5;
    if (hasFlip && formalityId !== "casual") score -= 6;
  }
  if (occasionId === "praia") {
    if (hasFlip || /rasteira|sandália|sandalia/i.test(shoes ? blobOf(shoes) : "")) score += 6;
    if (hasDressShoe) score -= 4;
  }
  if (formalityId === "formal" && hasAthletic && !pieces.every((p) => p.category === "sapatos" || !isAthletic(p))) {
    // athletic pieces in formal look
    const athleticNonShoe = pieces.filter((p) => p.category !== "sapatos" && isAthletic(p));
    if (athleticNonShoe.length) score -= 10;
  }

  // Jeans + blazer is fine for casual_arrumado; jeans + salto ok for encontro
  const hasJeans = pieces.some((p) => /jeans/i.test(blobOf(p)));
  const hasBlazer = pieces.some((p) => /blazer/i.test(blobOf(p)));
  if (hasJeans && hasBlazer && formalityId !== "formal") score += 4;

  return score;
}

export function scorePair(a: ClothingItem, b: ClothingItem): number {
  return scorePairColor(a, b) + scorePairStyle(a, b);
}

/**
 * Harmony of a full outfit. Typical range ~ -40 .. +80 depending on piece count.
 * Higher = better visual + style cohesion.
 */
export function scoreOutfitHarmony(
  pieces: ClothingItem[],
  occasionId?: OccasionId,
  formalityId?: FormalityId
): number {
  if (pieces.length < 2) return 0;
  let pairSum = 0;
  let pairs = 0;
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      pairSum += scorePair(pieces[i], pieces[j]);
      pairs++;
    }
  }
  const avgPairs = pairs ? pairSum / pairs : 0;
  // Weight by number of pairs so fuller looks aren't diluted too much
  let total = avgPairs * Math.min(pairs, 6) * 1.2;

  if (occasionId && formalityId) {
    total += scoreSilhouette(pieces, occasionId, formalityId);
  }

  // Prefer looks with at least one neutral anchor
  const neutrals = pieces.filter((p) => isNeutral(p)).length;
  if (neutrals >= 1) total += 4;
  if (neutrals === 0 && pieces.length >= 3) total -= 6;

  return total;
}

/** Score how well a candidate fits with the rest of an outfit (for slot swap). */
export function scoreItemAgainstOutfit(
  candidate: ClothingItem,
  outfit: Outfit,
  occasionId: OccasionId,
  formalityId: FormalityId,
  excludeSlot?: keyof Outfit
): number {
  const others = (Object.entries(outfit) as [keyof Outfit, ClothingItem | undefined][])
    .filter(([slot, item]) => item && slot !== excludeSlot)
    .map(([, item]) => item!);
  if (!others.length) return 0;
  const withCandidate = [...others, candidate];
  return scoreOutfitHarmony(withCandidate, occasionId, formalityId);
}

export function describeHarmony(pieces: ClothingItem[]): string {
  if (pieces.length < 2) return "peças do seu guarda-roupa";
  const neutrals = pieces.filter((p) => isNeutral(p)).length;
  const families = [...new Set(pieces.map((p) => styleFamily(p.style)).filter((f) => f !== "other"))];
  const colors = [...new Set(pieces.map((p) => p.color).filter(Boolean))].slice(0, 3);

  if (neutrals >= pieces.length - 1) return "base neutra e fácil de combinar";
  if (families.length === 1) {
    const label =
      families[0] === "classic"
        ? "linha clássica"
        : families[0] === "street"
          ? "estilo street"
          : families[0] === "boho"
            ? "clima boho"
            : families[0] === "smart"
              ? "casual elegante"
              : "mesmo universo de estilo";
    return `${label}${colors.length ? ` em ${colors.join(" / ")}` : ""}`;
  }
  if (neutrals >= 1 && colors.length) return `âncora neutra + ${colors.slice(0, 2).join(" e ")}`;
  if (colors.length >= 2) return `paleta ${colors.join(" + ")}`;
  return "cores e estilos alinhados";
}

/** Minimum harmony to accept an AI-proposed look instead of local rebuild */
export const MIN_AI_HARMONY = 8;
