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

  // Remove cloud pieces the user deleted locally (upsert alone never deletes)
  const keepIds = new Set(wardrobe.map((i) => i.id));
  const { data: remotePieces } = await supabase.from("pieces").select("id").eq("user_id", userId);
  const orphanIds = (remotePieces ?? []).map((r) => r.id as string).filter((id) => !keepIds.has(id));
  if (orphanIds.length) {
    await supabase.from("pieces").delete().eq("user_id", userId).in("id", orphanIds);
    for (const id of orphanIds) {
      try {
        await supabase.storage.from("wardrobe").remove([`${userId}/${id}.jpg`]);
      } catch {
        // ignore storage cleanup errors
      }
    }
  }

  // Looks: upsert then drop orphans
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
  const keepLookIds = new Set(state.savedLooks.map((l) => l.id));
  const { data: remoteLooks } = await supabase.from("looks").select("id").eq("user_id", userId);
  const orphanLooks = (remoteLooks ?? []).map((r) => r.id as string).filter((id) => !keepLookIds.has(id));
  if (orphanLooks.length) {
    await supabase.from("looks").delete().eq("user_id", userId).in("id", orphanLooks);
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
  const keepWishIds = new Set(state.wishList.map((w) => w.id));
  const { data: remoteWish } = await supabase.from("wish_list").select("id").eq("user_id", userId);
  const orphanWish = (remoteWish ?? []).map((r) => r.id as string).filter((id) => !keepWishIds.has(id));
  if (orphanWish.length) {
    await supabase.from("wish_list").delete().eq("user_id", userId).in("id", orphanWish);
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
  const keepChatIds = new Set(state.chatMessages.map((m) => m.id));
  const { data: remoteChat } = await supabase.from("chat_messages").select("id").eq("user_id", userId);
  const orphanChat = (remoteChat ?? []).map((r) => r.id as string).filter((id) => !keepChatIds.has(id));
  if (orphanChat.length) {
    await supabase.from("chat_messages").delete().eq("user_id", userId).in("id", orphanChat);
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

/** Merge cloud into local: local wardrobe wins once the device has been initialized (keeps deletes). */
function mergeChatMessages(local: ChatMessage[], cloud?: ChatMessage[]): ChatMessage[] {
  if (!cloud?.length) return local;
  if (!local.length) return cloud;
  const byId = new Map<string, ChatMessage>();
  for (const m of cloud) byId.set(m.id, m);
  for (const m of local) byId.set(m.id, m); // local wins on same id
  return Array.from(byId.values())
    .sort((a, b) => {
      const ta = Number(String(a.id).split("-")[0]) || 0;
      const tb = Number(String(b.id).split("-")[0]) || 0;
      return ta - tb;
    })
    .slice(-80);
}

export function mergeLocalAndCloud(
  local: PersistedState,
  cloud: Partial<PersistedState>
): PersistedState {
  // New device / empty local → restore from cloud. Otherwise local is source of truth (incl. deletions).
  const wardrobe =
    local.seeded || local.wardrobe.length > 0
      ? local.wardrobe
      : cloud.wardrobe?.length
        ? cloud.wardrobe
        : local.wardrobe;

  const savedLooks =
    local.seeded || local.savedLooks.length > 0
      ? local.savedLooks
      : cloud.savedLooks?.length
        ? cloud.savedLooks
        : local.savedLooks;

  const wishList =
    local.seeded || local.wishList.length > 0
      ? local.wishList
      : cloud.wishList?.length
        ? cloud.wishList
        : local.wishList;

  // Device week plan (looks planejados) wins — cloud was wiping outfitRefs on sync
  const weekPlan =
    local.seeded || local.weekPlan.length > 0
      ? local.weekPlan
      : cloud.weekPlan?.length
        ? cloud.weekPlan
        : local.weekPlan;

  return {
    ...local,
    wardrobe,
    savedLooks,
    weekPlan,
    wishList,
    favoriteStores: cloud.favoriteStores?.length ? cloud.favoriteStores : local.favoriteStores,
    // Union by id — never let cloud wipe local conversation
    chatMessages: mergeChatMessages(local.chatMessages, cloud.chatMessages),
    preferences: cloud.preferences
      ? {
          ...local.preferences,
          ...cloud.preferences,
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

/** Delete a single piece from Supabase right away so sync cannot revive it. */
export async function deletePieceFromCloud(pieceId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;
  await supabase.from("pieces").delete().eq("user_id", userId).eq("id", pieceId);
  try {
    await supabase.storage.from("wardrobe").remove([`${userId}/${pieceId}.jpg`]);
  } catch {
    // ignore
  }
}
