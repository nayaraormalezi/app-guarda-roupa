export type Status = "available" | "washing" | "borrowed";

/** Dress-code tone for the day’s look suggestion. */
export type FormalityId = "casual" | "casual_arrumado" | "formal";

export type OccasionId =
  | "trabalho"
  | "faculdade"
  | "encontro"
  | "festa"
  | "praia"
  | "viagem"
  | "academia"
  | "evento"
  | "casa";

export type Category =
  | "superiores"
  | "inferiores"
  | "vestidos"
  | "macacoes"
  | "casacos"
  | "sapatos"
  | "bolsas"
  | "acessorios";

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  subcategory: string;
  color: string;
  colorHex: string;
  style: string;
  season: string;
  occasion: string;
  /** Dress-code fit: casual / casual_arrumado / formal / todos */
  formality: FormalityId | "todos";
  status: Status;
  brand: string;
  uses: number;
  img: string;
  tall?: boolean;
  createdAt: number;
}

export interface Outfit {
  top?: ClothingItem;
  bottom?: ClothingItem;
  dress?: ClothingItem;
  shoe?: ClothingItem;
  bag?: ClothingItem;
  outerwear?: ClothingItem;
  accessory?: ClothingItem;
}

export interface OutfitRefs {
  top?: string;
  bottom?: string;
  dress?: string;
  shoe?: string;
  bag?: string;
  outerwear?: string;
  accessory?: string;
}

export interface SavedLook {
  id: string;
  name: string;
  createdAt: number;
  occasionId?: OccasionId;
  formalityId?: FormalityId;
  pieces: OutfitRefs;
}

export interface DayPlan {
  id: string;
  day: string;
  date: string;
  weather: string;
  /** Average (max+min)/2 — used by outfit engine */
  temp: number;
  tempMax: number;
  tempMin: number;
  occasionId: OccasionId;
  formalityId: FormalityId;
  /** Saved planned outfit for this day (piece ids) */
  outfitRefs?: OutfitRefs;
  used?: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  outfit?: Outfit;
  /** Persist outfit as refs so chat survives reloads */
  outfitRefs?: OutfitRefs;
  occasionId?: OccasionId;
  formalityId?: FormalityId;
  /** Week plan day this suggestion was meant for */
  planDayId?: string;
}

export interface WishItem {
  id: string;
  label: string;
  reason: string;
  categoryHint: Category;
  subcategoryHint: string;
  formalityHint: FormalityId | "todos";
  gapId?: string;
  storeName?: string;
  buyUrl?: string;
  imageUrl?: string;
  createdAt: number;
}

export interface FavoriteStore {
  id: string;
  name: string;
  url: string;
  createdAt: number;
}

export interface OccasionMeta {
  id: OccasionId;
  emoji: string;
  label: string;
  description: string;
  keywords: string[];
  defaultFormality: FormalityId;
}

export interface FormalityMeta {
  id: FormalityId;
  label: string;
  hint: string;
}

export type ThemePreference = "light" | "dark" | "system";

export interface AppPreferences {
  displayName: string;
  city: string;
  styleTags: string[];
  onboardingComplete: boolean;
  latitude?: number;
  longitude?: number;
  /** App appearance — defaults to system */
  theme?: ThemePreference;
}

export interface PersistedState {
  wardrobe: ClothingItem[];
  weekPlan: DayPlan[];
  preferences: AppPreferences;
  savedLooks: SavedLook[];
  chatMessages: ChatMessage[];
  wishList: WishItem[];
  favoriteStores: FavoriteStore[];
  /** Piece id → YYYY-MM-DD days counted as used (max 1 per day in stats). */
  pieceUseDays?: Record<string, string[]>;
  seeded: boolean;
}

/** @deprecated Prefer CATEGORIES + CATEGORY_LABELS from catalog */
export const FILTER_CHIPS = [
  "Todos",
  "superiores",
  "inferiores",
  "vestidos",
  "macacoes",
  "casacos",
  "sapatos",
  "bolsas",
  "acessorios",
] as const;

export const STYLE_TAG_OPTIONS = [
  "Minimalista",
  "Business Casual",
  "Elegante",
  "Neutros",
  "Atemporal",
  "Sustentável",
  "Casual",
  "Romântico",
] as const;

export const FORMALITIES: FormalityMeta[] = [
  {
    id: "casual",
    label: "Casual",
    hint: "Conforto e leveza no dia a dia",
  },
  {
    id: "casual_arrumado",
    label: "Casual Arrumado",
    hint: "Arrumado sem ser rígido — ideal para trabalho e faculdade",
  },
  {
    id: "formal",
    label: "Formal",
    hint: "Alfaiataria e look de impacto",
  },
];

export const OCCASIONS: OccasionMeta[] = [
  {
    id: "trabalho",
    emoji: "💼",
    label: "Trabalho",
    description: "Escritório e rotina profissional",
    keywords: ["trabalho", "escritorio", "escritório", "office"],
    defaultFormality: "casual_arrumado",
  },
  {
    id: "faculdade",
    emoji: "📚",
    label: "Faculdade",
    description: "Aula, campus e estudos",
    keywords: ["faculdade", "aula", "universidade", "campus", "estudo"],
    defaultFormality: "casual_arrumado",
  },
  {
    id: "encontro",
    emoji: "❤️",
    label: "Encontro",
    description: "Date, jantar ou noite a dois",
    keywords: ["encontro", "date", "jantar", "romantico", "romântico"],
    defaultFormality: "casual_arrumado",
  },
  {
    id: "festa",
    emoji: "🎉",
    label: "Festa",
    description: "Balada, aniversário e noite animada",
    keywords: ["festa", "balada", "aniversario", "aniversário", "party"],
    defaultFormality: "casual_arrumado",
  },
  {
    id: "praia",
    emoji: "🏖️",
    label: "Praia",
    description: "Sol, calor e looks leves",
    keywords: ["praia", "beach", "piscina", "mar"],
    defaultFormality: "casual",
  },
  {
    id: "viagem",
    emoji: "✈️",
    label: "Viagem",
    description: "Aeroporto e deslocamento confortável",
    keywords: ["viagem", "viajar", "aeroporto", "trip"],
    defaultFormality: "casual",
  },
  {
    id: "academia",
    emoji: "🏋️",
    label: "Academia",
    description: "Treino, caminhada e movimento",
    keywords: ["academia", "treino", "esporte", "corrida", "gym"],
    defaultFormality: "casual",
  },
  {
    id: "evento",
    emoji: "✨",
    label: "Evento",
    description: "Casamento, formatura e ocasiões especiais",
    keywords: ["evento", "casamento", "formatura", "wedding", "gala"],
    defaultFormality: "formal",
  },
  {
    id: "casa",
    emoji: "🏠",
    label: "Casa",
    description: "Home office, descanso e ficar em casa",
    keywords: ["casa", "home", "homeoffice", "descanso"],
    defaultFormality: "casual",
  },
];

/** Map legacy occasion ids from earlier app versions. */
const OCCASION_ALIASES: Record<string, OccasionId> = {
  reuniao: "evento",
  homeoffice: "casa",
  casual: "casa",
  livre: "casa",
  happyhour: "festa",
  lazer: "praia",
  esporte: "academia",
};

/** Map legacy formality ids. */
const FORMALITY_ALIASES: Record<string, FormalityId> = {
  informal: "casual",
  corporativo: "casual_arrumado",
  "casual arrumado": "casual_arrumado",
  casual_arrumado: "casual_arrumado",
  casual: "casual",
  formal: "formal",
};

export function normalizeOccasionId(raw: string | undefined): OccasionId {
  if (!raw) return "casa";
  const aliased = OCCASION_ALIASES[raw] ?? raw;
  if (OCCASIONS.some((o) => o.id === aliased)) return aliased as OccasionId;
  return "casa";
}

export function normalizeFormalityId(raw: string | undefined): FormalityId {
  if (!raw) return "casual_arrumado";
  const key = raw.toLowerCase().trim();
  return FORMALITY_ALIASES[key] ?? (FORMALITIES.some((f) => f.id === key) ? (key as FormalityId) : "casual_arrumado");
}

export function getOccasion(id: OccasionId | string): OccasionMeta {
  const normalized = normalizeOccasionId(id);
  return OCCASIONS.find((o) => o.id === normalized) ?? OCCASIONS.find((o) => o.id === "casa")!;
}

export function getFormality(id: FormalityId | string | undefined): FormalityMeta {
  const normalized = normalizeFormalityId(id);
  return FORMALITIES.find((f) => f.id === normalized) ?? FORMALITIES[1];
}

export function defaultFormalityFor(occasionId: OccasionId | string): FormalityId {
  return getOccasion(occasionId).defaultFormality;
}

export function outfitToRefs(outfit: Outfit): OutfitRefs {
  return {
    top: outfit.top?.id,
    bottom: outfit.bottom?.id,
    dress: outfit.dress?.id,
    shoe: outfit.shoe?.id,
    bag: outfit.bag?.id,
    outerwear: outfit.outerwear?.id,
    accessory: outfit.accessory?.id,
  };
}

export function outfitRefsEqual(a: OutfitRefs, b: OutfitRefs): boolean {
  return (
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.dress === b.dress &&
    a.shoe === b.shoe &&
    a.bag === b.bag &&
    a.outerwear === b.outerwear &&
    a.accessory === b.accessory
  );
}

export function findSavedLookForOutfit(
  savedLooks: SavedLook[],
  outfit: Outfit
): SavedLook | undefined {
  const refs = outfitToRefs(outfit);
  return savedLooks.find((look) => outfitRefsEqual(look.pieces, refs));
}
