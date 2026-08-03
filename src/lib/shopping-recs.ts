import type { ClothingItem, FavoriteStore, FormalityId, WishItem } from "@/data/types";
import { wardrobeGaps, type WardrobeGap } from "@/lib/outfit-engine";

export interface ShoppingProduct {
  id: string;
  title: string;
  query: string;
  reason: string;
  gapId: string;
  categoryHint: ClothingItem["category"];
  subcategoryHint: string;
  formalityHint: FormalityId | "todos";
  impactPct: number;
  storeId: string;
  storeName: string;
  buyUrl: string;
  colorHint: string;
  /** Imagem oficial do produto (loja / Google Shopping) */
  imageUrl: string;
  price?: string;
  /** true = produto real com link/imagem da vitrine */
  live?: boolean;
}

export interface ShoppingQueryPayload {
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
}

/** Lojas sugeridas para o usuário adicionar com 1 toque */
export const STORE_PRESETS: Omit<FavoriteStore, "id" | "createdAt">[] = [
  { name: "Zara", url: "https://www.zara.com/br/" },
  { name: "C&A", url: "https://www.cea.com.br/" },
  { name: "Renner", url: "https://www.lojasrenner.com.br/" },
  { name: "Farfetch", url: "https://www.farfetch.com/br/" },
  { name: "Dafiti", url: "https://www.dafiti.com.br/" },
  { name: "Amazon", url: "https://www.amazon.com.br/" },
  { name: "Shein", url: "https://br.shein.com/" },
  { name: "Netshoes", url: "https://www.netshoes.com.br/" },
];

function hostOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url.toLowerCase();
  }
}

function normalizeStoreUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

/** Monta URL de busca na loja (ou Google site:) para abrir a vitrine da peça. */
export function buildStoreSearchUrl(storeUrl: string, query: string): string {
  const url = normalizeStoreUrl(storeUrl);
  const q = encodeURIComponent(query);
  const host = hostOf(url);

  if (host.includes("zara.com")) {
    return `https://www.zara.com/br/pt/search?searchTerm=${q}&section=WOMAN`;
  }
  if (host.includes("cea.com.br") || host.includes("c&a")) {
    return `https://www.cea.com.br/busca?busca=${q}`;
  }
  if (host.includes("lojasrenner.com.br") || host.includes("renner")) {
    return `https://www.lojasrenner.com.br/b?Ntt=${q}`;
  }
  if (host.includes("farfetch.com")) {
    return `https://www.farfetch.com/br/shopping/women/search/items.aspx?q=${q}`;
  }
  if (host.includes("dafiti.com.br")) {
    return `https://www.dafiti.com.br/catalog/?q=${q}`;
  }
  if (host.includes("amazon.com")) {
    return `https://www.amazon.com.br/s?k=${q}`;
  }
  if (host.includes("shein.com")) {
    return `https://br.shein.com/pdsearch/${q}/`;
  }
  if (host.includes("netshoes.com.br")) {
    return `https://www.netshoes.com.br/busca?nsCat=Marketplace&q=${q}`;
  }
  if (host.includes("hm.com")) {
    return `https://www2.hm.com/pt_br/search-results.html?q=${q}`;
  }
  if (host.includes("reserve.com.br")) {
    return `https://www.reserve.com.br/busca?q=${q}`;
  }

  return `https://www.google.com/search?q=${encodeURIComponent(`site:${host} ${query}`)}`;
}

function dominantNeutrals(wardrobe: ClothingItem[]): string[] {
  const counts = new Map<string, number>();
  for (const i of wardrobe) {
    const c = i.color.toLowerCase();
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const neutrals = sorted.filter((c) =>
    /preto|branco|bege|nude|cinza|off|creme|marinho|camel/i.test(c)
  );
  return (neutrals.length ? neutrals : ["preto", "bege"]).slice(0, 2);
}

function productIdeasForGap(
  gap: WardrobeGap,
  colors: string[],
  styleTags: string[]
): { title: string; query: string; colorHint: string; imageUrl: string }[] {
  const color = colors[0] ?? "preto";
  const color2 = colors[1] ?? "bege";
  const style = styleTags[0]?.toLowerCase() ?? "minimalista";

  const map: Record<string, { title: string; query: string; colorHint: string; imageUrl: string }[]> = {
    blazers: [
      {
        title: `Blazer ${color} estruturado`,
        query: `blazer feminino ${color} estruturado`,
        colorHint: color,
        imageUrl:
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=640&h=800&fit=crop&auto=format",
      },
      {
        title: `Blazer ${color2} oversized`,
        query: `blazer oversized feminino ${color2}`,
        colorHint: color2,
        imageUrl:
          "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=640&h=800&fit=crop&auto=format",
      },
    ],
    "formal-shoes": [
      {
        title: `Mule de couro ${color}`,
        query: `mule couro feminino ${color}`,
        colorHint: color,
        imageUrl:
          "https://images.unsplash.com/photo-1543163521-1a05fdbc5468?w=640&h=800&fit=crop&auto=format",
      },
      {
        title: `Scarpin ${color2}`,
        query: `scarpin feminino ${color2} salto médio`,
        colorHint: color2,
        imageUrl:
          "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=640&h=800&fit=crop&auto=format",
      },
    ],
    "neutral-tops": [
      {
        title: `Camisa ${color} ${style}`,
        query: `camisa feminina ${color} ${style}`,
        colorHint: color,
        imageUrl:
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=640&h=800&fit=crop&auto=format",
      },
      {
        title: `Blusa básica ${color2}`,
        query: `blusa básica feminina ${color2}`,
        colorHint: color2,
        imageUrl:
          "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=640&h=800&fit=crop&auto=format",
      },
    ],
    bottoms: [
      {
        title: `Calça alfaiataria ${color}`,
        query: `calça alfaiataria feminina ${color}`,
        colorHint: color,
        imageUrl:
          "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=640&h=800&fit=crop&auto=format",
      },
      {
        title: `Saia midi ${color2}`,
        query: `saia midi feminina ${color2}`,
        colorHint: color2,
        imageUrl:
          "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=640&h=800&fit=crop&auto=format",
      },
    ],
    outerwear: [
      {
        title: `Trench coat ${color2}`,
        query: `trench coat feminino ${color2}`,
        colorHint: color2,
        imageUrl:
          "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=640&h=800&fit=crop&auto=format",
      },
      {
        title: `Cardigan ${color}`,
        query: `cardigan feminino ${color} leve`,
        colorHint: color,
        imageUrl:
          "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=640&h=800&fit=crop&auto=format",
      },
    ],
  };

  return (
    map[gap.id] ?? [
      {
        title: `${gap.label} ${color}`,
        query: `${gap.subcategoryHint} feminino ${color}`,
        colorHint: color,
        imageUrl:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=640&h=800&fit=crop&auto=format",
      },
    ]
  );
}

export function buildShoppingQueries(params: {
  wardrobe: ClothingItem[];
  stores: FavoriteStore[];
  styleTags: string[];
}): ShoppingQueryPayload[] {
  const { wardrobe, stores, styleTags } = params;
  if (!stores.length) return [];

  const gaps = wardrobeGaps(wardrobe);
  const colors = dominantNeutrals(wardrobe);
  const queries: ShoppingQueryPayload[] = [];

  gaps.forEach((gap, gapIndex) => {
    const ideas = productIdeasForGap(gap, colors, styleTags).slice(0, 1);
    ideas.forEach((idea, ideaIndex) => {
      const store = stores[(gapIndex + ideaIndex) % stores.length];
      queries.push({
        id: `${gap.id}-${store.id}-${ideaIndex}`,
        query: idea.query,
        gapId: gap.id,
        titleHint: idea.title,
        categoryHint: gap.categoryHint,
        subcategoryHint: gap.subcategoryHint,
        formalityHint: gap.formalityHint,
        impactPct: gap.impactPct,
        storeName: store.name,
        storeUrl: store.url,
      });
    });
  });

  return queries.slice(0, 6);
}

/** Busca produtos reais (imagem + link) via Edge Function / Google Shopping. */
export async function fetchLiveShoppingProducts(params: {
  wardrobe: ClothingItem[];
  stores: FavoriteStore[];
  styleTags: string[];
}): Promise<ShoppingProduct[]> {
  const { getSupabase, isSupabaseConfigured } = await import("@/lib/supabase");
  if (!isSupabaseConfigured()) throw new Error("Supabase não configurado");
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase não configurado");

  const queries = buildShoppingQueries(params);
  if (!queries.length) return [];

  const { data, error } = await supabase.functions.invoke("ai", {
    body: { mode: "shopping", queries },
  });
  if (error) throw error;
  if ((data as { error?: string } | null)?.error) {
    throw new Error(String((data as { error: string }).error));
  }

  const products = ((data as { products?: ShoppingProduct[] } | null)?.products ?? []).map(
    (p) => ({
      ...p,
      live: true,
      categoryHint: p.categoryHint as ClothingItem["category"],
      formalityHint: p.formalityHint as FormalityId | "todos",
    })
  );

  return products.filter(
    (p) =>
      p.title &&
      /^https?:\/\//i.test(p.buyUrl) &&
      /^https?:\/\//i.test(p.imageUrl)
  );
}

/** Fallback: só link de busca na loja (sem fingir produto específico). */
export function buildShoppingSearchFallbacks(params: {
  wardrobe: ClothingItem[];
  stores: FavoriteStore[];
  styleTags: string[];
}): ShoppingProduct[] {
  const queries = buildShoppingQueries(params);
  return queries.map((q) => ({
    id: `search-${q.id}`,
    title: q.titleHint,
    query: q.query,
    reason: `Abrir busca em ${q.storeName} (produto exato indisponível no momento).`,
    gapId: q.gapId,
    categoryHint: q.categoryHint as ClothingItem["category"],
    subcategoryHint: q.subcategoryHint,
    formalityHint: q.formalityHint as FormalityId | "todos",
    impactPct: q.impactPct,
    storeId: q.storeName,
    storeName: q.storeName,
    buyUrl: buildStoreSearchUrl(q.storeUrl, q.query),
    colorHint: "",
    imageUrl: "",
    live: false,
  }));
}

/** @deprecated use fetchLiveShoppingProducts */
export function buildShoppingProducts(params: {
  wardrobe: ClothingItem[];
  stores: FavoriteStore[];
  styleTags: string[];
}): ShoppingProduct[] {
  return buildShoppingSearchFallbacks(params);
}

export function toWishFromProduct(product: ShoppingProduct): Omit<WishItem, "id" | "createdAt"> {
  return {
    label: product.title,
    reason: `${product.reason} · ${product.storeName}`,
    categoryHint: product.categoryHint,
    subcategoryHint: product.subcategoryHint,
    formalityHint: product.formalityHint,
    gapId: product.gapId,
    storeName: product.storeName,
    buyUrl: product.buyUrl,
    imageUrl: product.imageUrl,
  };
}

export function normalizeFavoriteStoreInput(name: string, url: string): { name: string; url: string } | null {
  const n = name.trim();
  const u = normalizeStoreUrl(url);
  if (!n || !u) return null;
  try {
    // validate URL
    new URL(u);
  } catch {
    return null;
  }
  return { name: n, url: u };
}
