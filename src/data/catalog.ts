import type { FormalityId } from "./types";

/** Canonical clothing category IDs (Portuguese keys). */
export const CATEGORIES = [
  "superiores",
  "inferiores",
  "vestidos",
  "macacoes",
  "casacos",
  "sapatos",
  "bolsas",
  "acessorios",
] as const;

export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  superiores: "Superiores",
  inferiores: "Inferiores",
  vestidos: "Vestidos",
  macacoes: "Macacões",
  casacos: "Casacos",
  sapatos: "Sapatos",
  bolsas: "Bolsas",
  acessorios: "Acessórios",
};

export const SUBCATEGORIES: Record<(typeof CATEGORIES)[number], string[]> = {
  superiores: ["Blusa", "Camisa", "Camiseta", "Regata", "Body", "Cropped", "Tricot", "Colete"],
  inferiores: ["Calça", "Jeans", "Saia", "Shorts", "Bermuda", "Legging"],
  vestidos: ["Curto", "Midi", "Longo", "Envelope", "Tubinho"],
  macacoes: ["Macacão", "Jardineira", "Conjunto"],
  casacos: ["Blazer", "Casaco", "Jaqueta", "Trench", "Cardigan", "Colete", "Capuz"],
  sapatos: ["Tênis", "Salto", "Rasteira", "Mule", "Bota", "Oxford", "Sandália"],
  bolsas: ["Bolsa tiracolo", "Tote", "Clutch", "Mochila", "Carteira"],
  acessorios: ["Cinto", "Lenço", "Chapéu", "Óculos", "Joia", "Outro"],
};

export const COLOR_OPTIONS = [
  "Preto",
  "Branco",
  "Off-white",
  "Creme",
  "Bege",
  "Nude",
  "Cinza",
  "Camel",
  "Marrom",
  "Cognac",
  "Azul",
  "Azul-marinho",
  "Verde",
  "Vermelho",
  "Rosa",
  "Roxo",
  "Amarelo",
  "Laranja",
  "Estampado",
  "Metalizado",
] as const;

export const COLOR_HEX: Record<string, string> = {
  Preto: "#1A1A1A",
  Branco: "#F5F5F5",
  "Off-white": "#F0EDE5",
  Creme: "#E8E0D0",
  Bege: "#C9B89A",
  Nude: "#C9A882",
  Cinza: "#8C8C8C",
  Camel: "#C4956A",
  Marrom: "#6B4423",
  Cognac: "#8B5E3C",
  Azul: "#6B8E9F",
  "Azul-marinho": "#1E3A5F",
  Verde: "#4A7C59",
  Vermelho: "#A33A3A",
  Rosa: "#D4A5A5",
  Roxo: "#6B5B7A",
  Amarelo: "#D4B85A",
  Laranja: "#C47A3A",
  Estampado: "#C4B8A8",
  Metalizado: "#A8A29E",
};

export const STYLE_OPTIONS = [
  "Minimalista",
  "Casual",
  "Casual elegante",
  "Business casual",
  "Elegante",
  "Clássico",
  "Romântico",
  "Esportivo",
  "Streetwear",
  "Boho",
] as const;

export const SEASON_OPTIONS = ["Todos", "Verão", "Outono", "Inverno", "Primavera"] as const;

/** Occasion tags stored on clothing pieces (where the piece fits). */
export const OCCASION_OPTIONS = [
  "Todos",
  "Trabalho",
  "Faculdade",
  "Encontro",
  "Festa",
  "Praia",
  "Viagem",
  "Academia",
  "Evento",
  "Casa",
] as const;

export const FORMALITY_OPTIONS: {
  id: FormalityId | "todos";
  label: string;
  hint: string;
}[] = [
  { id: "todos", label: "Todos", hint: "Serve em qualquer formalidade" },
  { id: "casual", label: "Casual", hint: "Conforto e leveza" },
  { id: "casual_arrumado", label: "Casual Arrumado", hint: "Arrumado sem ser rígido" },
  { id: "formal", label: "Formal", hint: "Alfaiataria e look de impacto" },
];

export const FORMALITY_LABEL: Record<FormalityId | "todos", string> = {
  todos: "Todos",
  casual: "Casual",
  casual_arrumado: "Casual Arrumado",
  formal: "Formal",
};

export const STATUS_OPTIONS: { id: import("./types").Status; label: string }[] = [
  { id: "available", label: "Disponível" },
  { id: "washing", label: "Lavando" },
  { id: "borrowed", label: "Emprestada" },
];

export const STATUS_LABEL: Record<import("./types").Status, string> = {
  available: "Disponível",
  washing: "Lavando",
  borrowed: "Emprestada",
};

const LEGACY_CATEGORY: Record<string, (typeof CATEGORIES)[number]> = {
  Tops: "superiores",
  Bottoms: "inferiores",
  Dresses: "vestidos",
  Outerwear: "casacos",
  Shoes: "sapatos",
  Bags: "bolsas",
  superiores: "superiores",
  inferiores: "inferiores",
  vestidos: "vestidos",
  macacoes: "macacoes",
  casacos: "casacos",
  sapatos: "sapatos",
  bolsas: "bolsas",
  acessorios: "acessorios",
};

export function normalizeCategory(raw: string | undefined): (typeof CATEGORIES)[number] {
  if (!raw) return "superiores";
  return LEGACY_CATEGORY[raw] ?? "acessorios";
}

export function categoryLabel(id: string): string {
  const n = normalizeCategory(id);
  return CATEGORY_LABELS[n];
}

export function isTallCategory(category: (typeof CATEGORIES)[number]): boolean {
  return (
    category === "superiores" ||
    category === "vestidos" ||
    category === "macacoes" ||
    category === "casacos"
  );
}

export function defaultSubcategory(category: (typeof CATEGORIES)[number]): string {
  return SUBCATEGORIES[category][0] ?? "Geral";
}

export function colorHexFor(color: string): string {
  return COLOR_HEX[color] ?? "#C4B8A8";
}

export function normalizeFormality(raw: string | undefined): FormalityId | "todos" {
  if (!raw) return "todos";
  const key = raw.toLowerCase().trim();
  if (key === "todos" || key === "all") return "todos";
  if (key === "informal") return "casual";
  if (key === "corporativo" || key === "business casual" || key === "business") return "casual_arrumado";
  if (key === "casual arrumado" || key === "casual_arrumado") return "casual_arrumado";
  if (key === "casual") return "casual";
  if (key === "formal" || key === "elegante") return "formal";
  return "todos";
}
