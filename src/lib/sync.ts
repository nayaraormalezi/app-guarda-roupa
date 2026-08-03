import type {
  ChatMessage,
  ClothingItem,
  DayPlan,
  FavoriteStore,
  PersistedState,
  SavedLook,
  WishItem,
} from "@/data/types";
import { getSupabase } from "@/lib/supabase";

async function uploadPiecePhoto(userId: string, item: ClothingItem): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return item.img;
  if (item.img.startsWith("http")) return item.img;
  try {
    const path = `${userId}/${item.id}.jpg`;
    const response = await fetch(item.img);
    const blob = await response.blob();
    const { error } = await supabase.storage.from("wardrobe").upload(path, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) return item.img;
    const { data } = supabase.storage.from("wardrobe").getPublicUrl(path);
    return data.publicUrl || item.img;
  } catch {
    return item.img;
  }
}

export async function pushStateToCloud(state: PersistedState, userId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const wardrobe: ClothingItem[] = [];
  for (const item of state.wardrobe) {
    const img = await uploadPiecePhoto(userId, item);
    wardrobe.push({ ...item, img });
  }

  await supabase.from("profiles").upsert({
    id: userId,
    display_name: state.preferences.displayName,
    city: state.preferences.city,
    style_tags: state.preferences.styleTags,
    latitude: state.preferences.latitude ?? null,
    longitude: state.preferences.longitude ?? null,
    onboarding_complete: state.preferences.onboardingComplete,
    favorite_stores: state.favoriteStores ?? [],
    updated_at: new Date().toISOString(),
  });

  if (wardrobe.length) {
    await supabase.from("pieces").upsert(
      wardrobe.map((i) => ({
        id: i.id,
        user_id: userId,
        name: i.name,
        category: i.category,
        subcategory: i.subcategory,
        color: i.color,
        color_hex: i.colorHex,
        style: i.style,
        season: i.season,
        occasion: i.occasion,
        formality: i.formality,
        status: i.status,
        brand: i.brand,
        uses: i.uses,
        img: i.img,
        tall: i.tall ?? null,
        created_at: i.createdAt,
      }))
    );
  }

  if (state.savedLooks.length) {
    await supabase.from("looks").upsert(
      state.savedLooks.map((l: SavedLook) => ({
        id: l.id,
        user_id: userId,
        name: l.name,
        occasion_id: l.occasionId ?? null,
        formality_id: l.formalityId ?? null,
        pieces: l.pieces,
        created_at: l.createdAt,
      }))
    );
  }

  if (state.weekPlan.length) {
    await supabase.from("week_plans").upsert(
      state.weekPlan.map((d: DayPlan) => ({
        id: d.id,
        user_id: userId,
        day: d.day,
        date: d.date,
        weather: d.weather,
        temp: d.temp,
        temp_max: d.tempMax,
        temp_min: d.tempMin,
        occasion_id: d.occasionId,
        formality_id: d.formalityId,
        outfit_refs: d.outfitRefs ?? null,
        used: d.used ?? false,
      }))
    );
  }

  if (state.wishList.length) {
    await supabase.from("wish_list").upsert(
      state.wishList.map((w: WishItem) => ({
        id: w.id,
        user_id: userId,
        label: w.label,
        reason: w.reason,
        category_hint: w.categoryHint,
        subcategory_hint: w.subcategoryHint,
        formality_hint: w.formalityHint,
        gap_id: w.gapId ?? null,
        store_name: w.storeName ?? null,
        buy_url: w.buyUrl ?? null,
        image_url: w.imageUrl ?? null,
        created_at: w.createdAt,
      }))
    );
  }

  if (state.chatMessages.length) {
    await supabase.from("chat_messages").upsert(
      state.chatMessages.map((m: ChatMessage, idx) => ({
        id: m.id,
        user_id: userId,
        role: m.role,
        text: m.text,
        outfit_refs: m.outfitRefs ?? null,
        created_at: Date.now() - (state.chatMessages.length - idx),
      }))
    );
  }
}

export async function pullStateFromCloud(userId: string): Promise<Partial<PersistedState> | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const [profileRes, piecesRes, looksRes, weekRes, wishRes, chatRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("pieces").select("*").eq("user_id", userId),
    supabase.from("looks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("week_plans").select("*").eq("user_id", userId),
    supabase.from("wish_list").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("chat_messages").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
  ]);

  const profile = profileRes.data;
  const pieces = (piecesRes.data ?? []).map(
    (i): ClothingItem => ({
      id: i.id,
      name: i.name,
      category: i.category,
      subcategory: i.subcategory,
      color: i.color,
      colorHex: i.color_hex,
      style: i.style,
      season: i.season,
      occasion: i.occasion,
      formality: i.formality,
      status: i.status,
      brand: i.brand,
      uses: i.uses,
      img: i.img,
      tall: i.tall ?? undefined,
      createdAt: i.created_at,
    })
  );

  const savedLooks: SavedLook[] = (looksRes.data ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    createdAt: l.created_at,
    occasionId: l.occasion_id ?? undefined,
    formalityId: l.formality_id ?? undefined,
    pieces: l.pieces ?? {},
  }));

  const weekPlan: DayPlan[] = (weekRes.data ?? []).map((d) => ({
    id: d.id,
    day: d.day,
    date: d.date,
    weather: d.weather ?? "☀️",
    temp: Number(d.temp ?? 22),
    tempMax: Number(d.temp_max ?? d.temp ?? 26),
    tempMin: Number(d.temp_min ?? d.temp ?? 16),
    occasionId: d.occasion_id,
    formalityId: d.formality_id,
    outfitRefs: d.outfit_refs ?? undefined,
    used: Boolean(d.used),
  }));

  const wishList: WishItem[] = (wishRes.data ?? []).map((w) => ({
    id: w.id,
    label: w.label,
    reason: w.reason,
    categoryHint: w.category_hint,
    subcategoryHint: w.subcategory_hint,
    formalityHint: w.formality_hint,
    gapId: w.gap_id ?? undefined,
    storeName: w.store_name ?? undefined,
    buyUrl: w.buy_url ?? undefined,
    imageUrl: w.image_url ?? undefined,
    createdAt: w.created_at,
  }));

  const favoriteStores: FavoriteStore[] = Array.isArray(profile?.favorite_stores)
    ? (profile.favorite_stores as FavoriteStore[])
    : [];

  const chatMessages: ChatMessage[] = (chatRes.data ?? []).map((m) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    outfitRefs: m.outfit_refs ?? undefined,
  }));

  return {
    wardrobe: pieces.length ? pieces : undefined,
    savedLooks,
    weekPlan: weekPlan.length ? weekPlan : undefined,
    wishList,
    favoriteStores: favoriteStores.length ? favoriteStores : undefined,
    chatMessages: chatMessages.length ? chatMessages : undefined,
    preferences: profile
      ? {
          displayName: profile.display_name ?? "",
          city: profile.city ?? "",
          styleTags: profile.style_tags ?? [],
          onboardingComplete: Boolean(profile.onboarding_complete),
          latitude: profile.latitude ?? undefined,
          longitude: profile.longitude ?? undefined,
        }
      : undefined,
  };
}

/** Merge cloud into local: cloud wins for non-empty collections; keep local photos if cloud empty. */
export function mergeLocalAndCloud(
  local: PersistedState,
  cloud: Partial<PersistedState>
): PersistedState {
  const wardrobe =
    cloud.wardrobe && cloud.wardrobe.length >= local.wardrobe.length
      ? cloud.wardrobe
      : local.wardrobe.length
        ? local.wardrobe
        : cloud.wardrobe ?? local.wardrobe;

  return {
    ...local,
    wardrobe,
    savedLooks: cloud.savedLooks?.length ? cloud.savedLooks : local.savedLooks,
    weekPlan: cloud.weekPlan?.length ? cloud.weekPlan : local.weekPlan,
    wishList: cloud.wishList?.length ? cloud.wishList : local.wishList,
    favoriteStores: cloud.favoriteStores?.length ? cloud.favoriteStores : local.favoriteStores,
    chatMessages: cloud.chatMessages?.length ? cloud.chatMessages : local.chatMessages,
    preferences: cloud.preferences
      ? {
          ...local.preferences,
          ...cloud.preferences,
          // Uma vez completo (local ou nuvem), não voltar ao onboarding
          onboardingComplete:
            Boolean(local.preferences.onboardingComplete) ||
            Boolean(cloud.preferences.onboardingComplete),
          displayName: cloud.preferences.displayName || local.preferences.displayName,
          city: cloud.preferences.city || local.preferences.city,
          styleTags:
            cloud.preferences.styleTags?.length
              ? cloud.preferences.styleTags
              : local.preferences.styleTags,
        }
      : local.preferences,
    seeded: true,
  };
}
