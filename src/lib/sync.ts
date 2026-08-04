import type {
  ChatMessage,
  ClothingItem,
  DayPlan,
  FavoriteStore,
  PersistedState,
  SavedLook,
  WishItem,
} from "@/data/types";
import { buildWeekPlan, rollWeekForward } from "@/data/seed";
import { getSupabase } from "@/lib/supabase";

function dateKeyFromDay(d: DayPlan): string {
  return d.id.replace(/^day-/, "");
}

/** Merge weeks by calendar date onto a rolling “today” skeleton. Local planned looks win. */
export function mergeWeekPlans(local: DayPlan[], cloud?: DayPlan[]): DayPlan[] {
  const localByDate = new Map(local.map((d) => [dateKeyFromDay(d), d] as const));
  const cloudByDate = new Map((cloud ?? []).map((d) => [dateKeyFromDay(d), d] as const));
  const skeleton = rollWeekForward(
    local.length ? local : cloud?.length ? cloud : buildWeekPlan()
  );

  return skeleton.map((day) => {
    const key = dateKeyFromDay(day);
    const L = localByDate.get(key);
    const C = cloudByDate.get(key);
    if (!L && !C) return day;
    return {
      ...day,
      occasionId: L?.occasionId ?? C?.occasionId ?? day.occasionId,
      formalityId: L?.formalityId ?? C?.formalityId ?? day.formalityId,
      weather: L?.weather || C?.weather || day.weather,
      temp: L?.temp ?? C?.temp ?? day.temp,
      tempMax: L?.tempMax ?? C?.tempMax ?? day.tempMax,
      tempMin: L?.tempMin ?? C?.tempMin ?? day.tempMin,
      outfitRefs: L?.outfitRefs ?? C?.outfitRefs,
      used: L?.used ?? C?.used,
    };
  });
}

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

  const firstError =
    profileRes.error ||
    piecesRes.error ||
    looksRes.error ||
    weekRes.error ||
    wishRes.error ||
    chatRes.error;
  if (firstError) {
    throw new Error(firstError.message || "Falha ao ler dados da nuvem");
  }

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

/** Empty local (or demo seed only) restores from cloud; otherwise local list wins (incl. deletes). */
function pickSyncedList<T extends { id: string }>(
  local: T[],
  cloud: T[] | undefined,
  opts?: { treatAsEmpty?: boolean }
): T[] {
  const localEmpty = !local.length || Boolean(opts?.treatAsEmpty);
  if (localEmpty && cloud?.length) return cloud;
  if (!cloud?.length) return local;
  if (localEmpty) return local;
  // Both have real data: union by id, local wins on conflict (preserves offline edits + cloud extras)
  const byId = new Map<string, T>();
  for (const item of cloud) byId.set(item.id, item);
  for (const item of local) byId.set(item.id, item);
  return Array.from(byId.values());
}

const DEMO_SEED_IDS = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]);

function isDemoSeedWardrobe(items: ClothingItem[]): boolean {
  return items.length > 0 && items.every((i) => DEMO_SEED_IDS.has(i.id));
}

export function mergeLocalAndCloud(
  local: PersistedState,
  cloud: Partial<PersistedState>
): PersistedState {
  const wardrobe = pickSyncedList(local.wardrobe, cloud.wardrobe, {
    treatAsEmpty: isDemoSeedWardrobe(local.wardrobe),
  });
  const savedLooks = pickSyncedList(local.savedLooks, cloud.savedLooks);
  const wishList = pickSyncedList(local.wishList, cloud.wishList);

  // Always roll onto “today” and merge by date — local outfitRefs/used win over cloud.
  const weekPlan = mergeWeekPlans(local.weekPlan, cloud.weekPlan);

  const favoriteStores =
    (local.favoriteStores?.length ?? 0) > 0
      ? local.favoriteStores ?? []
      : cloud.favoriteStores?.length
        ? cloud.favoriteStores
        : local.favoriteStores ?? [];

  return {
    ...local,
    wardrobe,
    savedLooks,
    weekPlan,
    wishList,
    favoriteStores,
    // Union by id — never let cloud wipe local conversation
    chatMessages: mergeChatMessages(local.chatMessages, cloud.chatMessages),
    preferences: cloud.preferences
      ? {
          // Cloud fills gaps; local preferences win (city/coords/name the user just set).
          ...cloud.preferences,
          ...local.preferences,
          onboardingComplete:
            Boolean(local.preferences.onboardingComplete) ||
            Boolean(cloud.preferences.onboardingComplete),
          displayName: local.preferences.displayName || cloud.preferences.displayName || "",
          city: local.preferences.city || cloud.preferences.city || "",
          styleTags:
            local.preferences.styleTags?.length
              ? local.preferences.styleTags
              : cloud.preferences.styleTags ?? [],
          latitude: local.preferences.latitude ?? cloud.preferences.latitude,
          longitude: local.preferences.longitude ?? cloud.preferences.longitude,
          theme: local.preferences.theme ?? cloud.preferences.theme,
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
