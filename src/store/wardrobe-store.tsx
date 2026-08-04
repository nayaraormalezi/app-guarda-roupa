import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type {
  AppPreferences,
  Category,
  ChatMessage,
  ClothingItem,
  DayPlan,
  FormalityId,
  OccasionId,
  Outfit,
  OutfitRefs,
  PersistedState,
  SavedLook,
  Status,
  WishItem,
  FavoriteStore,
} from "@/data/types";
import {
  defaultFormalityFor,
  normalizeFormalityId,
  normalizeOccasionId,
  outfitToRefs,
} from "@/data/types";
import { buildWeekPlan, dayPlanId, rollWeekForward } from "@/data/seed";
import { createId, deletePhotoIfLocal, loadState, savePhotoFromUri, saveState } from "@/lib/storage";
import { outfitPieceIds } from "@/lib/outfit-engine";
import { applyPieceUseDay, dateKeyFromDayId } from "@/lib/piece-use";
import { localDateKey } from "@/data/seed";
import { fetchWeekWeather } from "@/lib/weather";

type NewItemInput = Omit<ClothingItem, "id" | "uses" | "createdAt" | "img"> & {
  imageUri: string;
};

type ItemPatch = Partial<
  Pick<
    ClothingItem,
    | "name"
    | "brand"
    | "category"
    | "subcategory"
    | "color"
    | "colorHex"
    | "style"
    | "season"
    | "occasion"
    | "formality"
    | "status"
    | "tall"
  >
>;

interface WardrobeContextValue {
  ready: boolean;
  wardrobe: ClothingItem[];
  weekPlan: DayPlan[];
  preferences: AppPreferences;
  savedLooks: SavedLook[];
  chatMessages: ChatMessage[];
  wishList: WishItem[];
  favoriteStores: FavoriteStore[];
  weatherLoading: boolean;
  addItem: (input: NewItemInput) => Promise<ClothingItem>;
  updateItem: (id: string, patch: ItemPatch) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateItemStatus: (id: string, status: Status) => Promise<void>;
  incrementUses: (ids: string[]) => Promise<void>;
  setDayOccasion: (dayId: string, occasionId: OccasionId) => Promise<void>;
  setDayFormality: (dayId: string, formalityId: FormalityId) => Promise<void>;
  setDayOutfit: (dayId: string, outfit: Outfit | null) => Promise<void>;
  applyStylistLook: (params: {
    dayId: string;
    outfit: Outfit;
    occasionId?: OccasionId;
    formalityId?: FormalityId;
  }) => Promise<void>;
  markDayUsed: (dayId: string, used?: boolean) => Promise<void>;
  resolveDayOutfit: (day: DayPlan) => Outfit | null;
  getTodayPlan: () => DayPlan | undefined;
  updatePreferences: (patch: Partial<AppPreferences>) => Promise<void>;
  completeOnboarding: (prefs: {
    displayName: string;
    city: string;
    styleTags: string[];
    latitude: number;
    longitude: number;
  }) => Promise<void>;
  saveLook: (
    outfit: Outfit,
    name?: string,
    occasionId?: OccasionId,
    formalityId?: FormalityId
  ) => Promise<SavedLook>;
  deleteLook: (id: string) => Promise<void>;
  resolveLook: (look: SavedLook) => Outfit;
  resolveOutfitRefs: (refs?: OutfitRefs) => Outfit;
  refreshWeather: (prefsOverride?: Partial<AppPreferences>) => Promise<void>;
  getItem: (id: string) => ClothingItem | undefined;
  todayLookVariant: number;
  todayExcludeIds: string[];
  /** Bumps variant once and returns the values to pass into buildOutfit. */
  refreshTodayLook: (currentOutfit?: Outfit | null) => { variant: number; excludeIds: string[] };
  appendChatMessages: (msgs: ChatMessage[]) => Promise<void>;
  replaceChatMessages: (msgs: ChatMessage[]) => Promise<void>;
  addWish: (input: Omit<WishItem, "id" | "createdAt">) => Promise<WishItem>;
  removeWish: (id: string) => Promise<void>;
  addFavoriteStore: (input: { name: string; url: string }) => Promise<FavoriteStore>;
  removeFavoriteStore: (id: string) => Promise<void>;
  replacePersistedState: (next: PersistedState) => Promise<void>;
  getPersistedSnapshot: () => PersistedState;
  filterWardrobe: (opts: {
    query: string;
    category: string;
    brand: string;
    color: string;
    style: string;
    status: string;
  }) => ClothingItem[];
}

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PersistedState | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [todayLookVariant, setTodayLookVariant] = useState(0);
  const [todayExcludeIds, setTodayExcludeIds] = useState<string[]>([]);
  const stateRef = useRef<PersistedState | null>(null);
  const todayLookVariantRef = useRef(0);
  todayLookVariantRef.current = todayLookVariant;

  const persist = useCallback(async (next: PersistedState) => {
    stateRef.current = next;
    setState(next);
    await saveState(next);
  }, []);

  const applyWeather = useCallback(async (base: PersistedState) => {
    let prefs = base.preferences;
    if ((prefs.latitude == null || prefs.longitude == null) && prefs.city) {
      try {
        const { searchCities } = await import("@/lib/weather");
        const found = await searchCities(prefs.city);
        if (found[0]) {
          prefs = {
            ...prefs,
            latitude: found[0].latitude,
            longitude: found[0].longitude,
            city: found[0].name,
          };
        }
      } catch {
        // keep without coords
      }
    }
    const { latitude, longitude } = prefs;
    if (latitude == null || longitude == null) {
      return { ...base, preferences: prefs, weekPlan: rollWeekForward(base.weekPlan) };
    }
    try {
      setWeatherLoading(true);
      const days = await fetchWeekWeather(latitude, longitude);
      const prevById = new Map(base.weekPlan.map((d) => [d.id, d]));
      const prevByDate = new Map(
        base.weekPlan.map((d) => [d.id.replace(/^day-/, ""), d] as const)
      );
      const merged = buildWeekPlan(
        new Date(),
        days.map((d) => ({
          weather: d.weather,
          temp: d.temp,
          tempMax: d.tempMax,
          tempMin: d.tempMin,
        }))
      ).map((day) => {
        const dateKey = day.id.replace(/^day-/, "");
        const prev = prevById.get(day.id) ?? prevByDate.get(dateKey);
        return {
          ...day,
          occasionId: normalizeOccasionId(prev?.occasionId ?? day.occasionId),
          formalityId: normalizeFormalityId(prev?.formalityId ?? day.formalityId),
          outfitRefs: prev?.outfitRefs,
          used: prev?.used,
        };
      });
      return { ...base, preferences: prefs, weekPlan: merged };
    } catch {
      return { ...base, preferences: prefs, weekPlan: rollWeekForward(base.weekPlan) };
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let loaded = await loadState();
      loaded = { ...loaded, weekPlan: rollWeekForward(loaded.weekPlan) };
      if (loaded.preferences.onboardingComplete && loaded.preferences.latitude != null) {
        loaded = await applyWeather(loaded);
      }
      if (!mounted) return;
      stateRef.current = loaded;
      setState(loaded);
      await saveState(loaded);
      setReady(true);
    })();
    return () => {
      mounted = false;
    };
  }, [applyWeather]);

  const resolveOutfitRefs = useCallback(
    (refs?: OutfitRefs): Outfit => {
      const find = (id?: string) => state?.wardrobe.find((i) => i.id === id);
      if (!refs) return {};
      return {
        top: find(refs.top),
        bottom: find(refs.bottom),
        dress: find(refs.dress),
        shoe: find(refs.shoe),
        bag: find(refs.bag),
        outerwear: find(refs.outerwear),
        accessory: find(refs.accessory),
      };
    },
    [state?.wardrobe]
  );

  const resolveDayOutfit = useCallback(
    (day: DayPlan): Outfit | null => {
      if (!day.outfitRefs) return null;
      const outfit = resolveOutfitRefs(day.outfitRefs);
      return Object.values(outfit).some(Boolean) ? outfit : null;
    },
    [resolveOutfitRefs]
  );

  const getTodayPlan = useCallback((): DayPlan | undefined => {
    const plan = state?.weekPlan ?? [];
    const todayKey = dayPlanId(new Date());
    return plan.find((d) => d.id === todayKey);
  }, [state?.weekPlan]);

  const addItem = useCallback(
    async (input: NewItemInput) => {
      const current = stateRef.current;
      if (!current) throw new Error("Store not ready");
      const img = await savePhotoFromUri(input.imageUri);
      const item: ClothingItem = {
        id: createId(),
        name: input.name,
        category: input.category,
        subcategory: input.subcategory,
        color: input.color,
        colorHex: input.colorHex,
        style: input.style,
        season: input.season,
        occasion: input.occasion,
        formality: input.formality ?? "todos",
        status: input.status,
        brand: input.brand,
        uses: 0,
        img,
        tall: input.tall,
        createdAt: Date.now(),
      };
      await persist({ ...current, wardrobe: [item, ...current.wardrobe] });
      return item;
    },
    [persist]
  );

  const updateItem = useCallback(
    async (id: string, patch: ItemPatch) => {
      const current = stateRef.current;
      if (!current) return;
      await persist({
        ...current,
        wardrobe: current.wardrobe.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      });
    },
    [persist]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const current = stateRef.current;
      if (!current) return;
      const item = current.wardrobe.find((i) => i.id === id);
      if (item) await deletePhotoIfLocal(item.img);
      await persist({
        ...current,
        wardrobe: current.wardrobe.filter((i) => i.id !== id),
        savedLooks: current.savedLooks.map((look) => ({
          ...look,
          pieces: Object.fromEntries(
            Object.entries(look.pieces).map(([k, v]) => [k, v === id ? undefined : v])
          ) as SavedLook["pieces"],
        })),
      });
      void import("@/lib/sync").then(({ deletePieceFromCloud }) => deletePieceFromCloud(id));
    },
    [persist]
  );

  const updateItemStatus = useCallback(
    async (id: string, status: Status) => {
      await updateItem(id, { status });
    },
    [updateItem]
  );

  const incrementUses = useCallback(
    async (ids: string[]) => {
      const current = stateRef.current;
      if (!current || !ids.length) return;
      const unique = [...new Set(ids.filter(Boolean))];
      const { wardrobe, pieceUseDays } = applyPieceUseDay(
        current.wardrobe,
        current.pieceUseDays ?? {},
        unique,
        localDateKey(new Date()),
        "add"
      );
      await persist({ ...current, wardrobe, pieceUseDays });
    },
    [persist]
  );

  const setDayOccasion = useCallback(
    async (dayId: string, occasionId: OccasionId) => {
      const current = stateRef.current;
      if (!current) return;
      const normalized = normalizeOccasionId(occasionId);
      await persist({
        ...current,
        weekPlan: current.weekPlan.map((d) =>
          d.id === dayId
            ? {
                ...d,
                occasionId: normalized,
                formalityId: defaultFormalityFor(normalized),
                // Clear planned look so UI regenerates for the new occasion
                outfitRefs: undefined,
                used: false,
              }
            : d
        ),
      });
    },
    [persist]
  );

  const setDayFormality = useCallback(
    async (dayId: string, formalityId: FormalityId) => {
      const current = stateRef.current;
      if (!current) return;
      await persist({
        ...current,
        weekPlan: current.weekPlan.map((d) =>
          d.id === dayId
            ? {
                ...d,
                formalityId: normalizeFormalityId(formalityId),
                outfitRefs: undefined,
                used: false,
              }
            : d
        ),
      });
    },
    [persist]
  );

  const setDayOutfit = useCallback(
    async (dayId: string, outfit: Outfit | null) => {
      const current = stateRef.current;
      if (!current) return;
      await persist({
        ...current,
        weekPlan: current.weekPlan.map((d) =>
          d.id === dayId
            ? {
                ...d,
                outfitRefs: outfit ? outfitToRefs(outfit) : undefined,
                used: outfit ? d.used : false,
              }
            : d
        ),
      });
    },
    [persist]
  );

  const applyStylistLook = useCallback(
    async (params: {
      dayId: string;
      outfit: Outfit;
      occasionId?: OccasionId;
      formalityId?: FormalityId;
    }) => {
      const current = stateRef.current;
      if (!current) return;
      const { dayId, outfit, occasionId, formalityId } = params;
      await persist({
        ...current,
        weekPlan: current.weekPlan.map((d) => {
          if (d.id !== dayId) return d;
          const nextOccasion = occasionId ? normalizeOccasionId(occasionId) : d.occasionId;
          const nextFormality = formalityId
            ? normalizeFormalityId(formalityId)
            : occasionId
              ? defaultFormalityFor(nextOccasion)
              : d.formalityId;
          return {
            ...d,
            occasionId: nextOccasion,
            formalityId: nextFormality,
            outfitRefs: outfitToRefs(outfit),
            used: false,
          };
        }),
      });
    },
    [persist]
  );

  const markDayUsed = useCallback(
    async (dayId: string, used = true) => {
      const current = stateRef.current;
      if (!current) return;
      const day = current.weekPlan.find((d) => d.id === dayId);
      const wasUsed = Boolean(day?.used);
      const ids = day?.outfitRefs
        ? ([...new Set(Object.values(day.outfitRefs).filter(Boolean))] as string[])
        : [];

      let wardrobe = current.wardrobe;
      let pieceUseDays = current.pieceUseDays ?? {};

      // Only change use counts when the used flag actually flips
      if (used !== wasUsed && ids.length) {
        const applied = applyPieceUseDay(
          wardrobe,
          pieceUseDays,
          ids,
          dateKeyFromDayId(dayId),
          used ? "add" : "remove"
        );
        wardrobe = applied.wardrobe;
        pieceUseDays = applied.pieceUseDays;
      }

      await persist({
        ...current,
        wardrobe,
        pieceUseDays,
        weekPlan: current.weekPlan.map((d) => (d.id === dayId ? { ...d, used } : d)),
      });
    },
    [persist]
  );

  const updatePreferences = useCallback(
    async (patch: Partial<AppPreferences>) => {
      const current = stateRef.current;
      if (!current) return;
      await persist({
        ...current,
        preferences: { ...current.preferences, ...patch },
      });
    },
    [persist]
  );

  const completeOnboarding = useCallback(
    async (prefs: {
      displayName: string;
      city: string;
      styleTags: string[];
      latitude: number;
      longitude: number;
    }) => {
      const current = stateRef.current;
      if (!current) return;
      let next: PersistedState = {
        ...current,
        preferences: {
          ...current.preferences,
          displayName: prefs.displayName.trim(),
          city: prefs.city.trim(),
          styleTags: prefs.styleTags,
          latitude: prefs.latitude,
          longitude: prefs.longitude,
          onboardingComplete: true,
        },
      };
      next = await applyWeather(next);
      await persist(next);
    },
    [applyWeather, persist]
  );

  const saveLook = useCallback(
    async (
      outfit: Outfit,
      name?: string,
      occasionId?: OccasionId,
      formalityId?: FormalityId
    ) => {
      const current = stateRef.current;
      if (!current) throw new Error("Store not ready");
      const look: SavedLook = {
        id: createId(),
        name: name?.trim() || `Look ${new Date().toLocaleDateString("pt-BR")}`,
        createdAt: Date.now(),
        occasionId,
        formalityId,
        pieces: outfitToRefs(outfit),
      };
      await persist({
        ...current,
        savedLooks: [look, ...current.savedLooks],
      });
      return look;
    },
    [persist]
  );

  const deleteLook = useCallback(
    async (id: string) => {
      const current = stateRef.current;
      if (!current) return;
      await persist({
        ...current,
        savedLooks: current.savedLooks.filter((l) => l.id !== id),
      });
    },
    [persist]
  );

  const resolveLook = useCallback(
    (look: SavedLook): Outfit => resolveOutfitRefs(look.pieces),
    [resolveOutfitRefs]
  );

  const refreshWeather = useCallback(
    async (prefsOverride?: Partial<AppPreferences>) => {
      const current = stateRef.current;
      if (!current) return;
      const base = prefsOverride
        ? { ...current, preferences: { ...current.preferences, ...prefsOverride } }
        : current;
      const next = await applyWeather(base);
      await persist(next);
    },
    [applyWeather, persist]
  );

  const refreshTodayLook = useCallback((currentOutfit?: Outfit | null) => {
    const excludeIds = currentOutfit ? outfitPieceIds(currentOutfit) : [];
    const variant = todayLookVariantRef.current + 1;
    todayLookVariantRef.current = variant;
    setTodayExcludeIds(excludeIds);
    setTodayLookVariant(variant);
    return { variant, excludeIds };
  }, []);

  const appendChatMessages = useCallback(
    async (msgs: ChatMessage[]) => {
      const current = stateRef.current;
      if (!current || !msgs.length) return;
      const slim = msgs.map((m) => ({
        ...m,
        outfit: undefined,
        outfitRefs: m.outfitRefs ?? (m.outfit ? outfitToRefs(m.outfit) : undefined),
      }));
      const existingIds = new Set(current.chatMessages.map((m) => m.id));
      const fresh = slim.filter((m) => !existingIds.has(m.id));
      if (!fresh.length) return;
      await persist({
        ...current,
        chatMessages: [...current.chatMessages, ...fresh].slice(-80),
      });
    },
    [persist]
  );

  const replaceChatMessages = useCallback(
    async (msgs: ChatMessage[]) => {
      const current = stateRef.current;
      if (!current) return;
      await persist({ ...current, chatMessages: msgs.slice(-80) });
    },
    [persist]
  );

  const addWish = useCallback(
    async (input: Omit<WishItem, "id" | "createdAt">) => {
      const current = stateRef.current;
      if (!current) throw new Error("Store not ready");
      const item: WishItem = { ...input, id: createId(), createdAt: Date.now() };
      await persist({ ...current, wishList: [item, ...current.wishList] });
      return item;
    },
    [persist]
  );

  const removeWish = useCallback(
    async (id: string) => {
      const current = stateRef.current;
      if (!current) return;
      await persist({ ...current, wishList: current.wishList.filter((w) => w.id !== id) });
    },
    [persist]
  );

  const addFavoriteStore = useCallback(
    async (input: { name: string; url: string }) => {
      const current = stateRef.current;
      if (!current) throw new Error("Store not ready");
      const item: FavoriteStore = {
        id: createId(),
        name: input.name.trim(),
        url: input.url.trim(),
        createdAt: Date.now(),
      };
      const exists = current.favoriteStores.some(
        (s) => s.url.replace(/\/$/, "") === item.url.replace(/\/$/, "")
      );
      if (exists) {
        return current.favoriteStores.find(
          (s) => s.url.replace(/\/$/, "") === item.url.replace(/\/$/, "")
        )!;
      }
      await persist({ ...current, favoriteStores: [item, ...current.favoriteStores] });
      return item;
    },
    [persist]
  );

  const removeFavoriteStore = useCallback(
    async (id: string) => {
      const current = stateRef.current;
      if (!current) return;
      await persist({
        ...current,
        favoriteStores: current.favoriteStores.filter((s) => s.id !== id),
      });
    },
    [persist]
  );

  const replacePersistedState = useCallback(
    async (next: PersistedState) => {
      await persist(next);
    },
    [persist]
  );

  const getPersistedSnapshot = useCallback((): PersistedState => {
    return (
      stateRef.current ??
      state ?? {
        wardrobe: [],
        weekPlan: [],
        preferences: {
          displayName: "",
          city: "",
          styleTags: [],
          onboardingComplete: false,
        },
        savedLooks: [],
        chatMessages: [],
        wishList: [],
        favoriteStores: [],
        pieceUseDays: {},
        seeded: true,
      }
    );
  }, [state]);

  const getItem = useCallback(
    (id: string) => state?.wardrobe.find((i) => i.id === id),
    [state?.wardrobe]
  );

  const filterWardrobe = useCallback(
    (opts: {
      query: string;
      category: string;
      brand: string;
      color: string;
      style: string;
      status: string;
    }) => {
      const list = state?.wardrobe ?? [];
      const q = opts.query.trim().toLowerCase();
      return list.filter((item) => {
        const matchSearch =
          !q ||
          item.name.toLowerCase().includes(q) ||
          item.brand.toLowerCase().includes(q) ||
          item.color.toLowerCase().includes(q) ||
          item.style.toLowerCase().includes(q) ||
          item.subcategory.toLowerCase().includes(q);
        const matchCategory = opts.category === "Todos" || item.category === opts.category;
        const matchBrand = opts.brand === "Todas" || item.brand === opts.brand;
        const matchColor = opts.color === "Todas" || item.color === opts.color;
        const matchStyle = opts.style === "Todos" || item.style === opts.style;
        const matchStatus = opts.status === "Todos" || item.status === opts.status;
        return (
          matchSearch && matchCategory && matchBrand && matchColor && matchStyle && matchStatus
        );
      });
    },
    [state?.wardrobe]
  );

  const value = useMemo<WardrobeContextValue>(
    () => ({
      ready,
      wardrobe: state?.wardrobe ?? [],
      weekPlan: state?.weekPlan ?? [],
      preferences: state?.preferences ?? {
        displayName: "",
        city: "",
        styleTags: [],
        onboardingComplete: false,
      },
      savedLooks: state?.savedLooks ?? [],
      chatMessages: state?.chatMessages ?? [],
      wishList: state?.wishList ?? [],
      favoriteStores: state?.favoriteStores ?? [],
      weatherLoading,
      addItem,
      updateItem,
      deleteItem,
      updateItemStatus,
      incrementUses,
      setDayOccasion,
      setDayFormality,
      setDayOutfit,
      applyStylistLook,
      markDayUsed,
      resolveDayOutfit,
      getTodayPlan,
      updatePreferences,
      completeOnboarding,
      saveLook,
      deleteLook,
      resolveLook,
      resolveOutfitRefs,
      refreshWeather,
      getItem,
      todayLookVariant,
      todayExcludeIds,
      refreshTodayLook,
      appendChatMessages,
      replaceChatMessages,
      addWish,
      removeWish,
      addFavoriteStore,
      removeFavoriteStore,
      replacePersistedState,
      getPersistedSnapshot,
      filterWardrobe,
    }),
    [
      ready,
      state,
      weatherLoading,
      addItem,
      updateItem,
      deleteItem,
      updateItemStatus,
      incrementUses,
      setDayOccasion,
      setDayFormality,
      setDayOutfit,
      applyStylistLook,
      markDayUsed,
      resolveDayOutfit,
      getTodayPlan,
      updatePreferences,
      completeOnboarding,
      saveLook,
      deleteLook,
      resolveLook,
      resolveOutfitRefs,
      refreshWeather,
      getItem,
      todayLookVariant,
      todayExcludeIds,
      refreshTodayLook,
      appendChatMessages,
      replaceChatMessages,
      addWish,
      removeWish,
      addFavoriteStore,
      removeFavoriteStore,
      replacePersistedState,
      getPersistedSnapshot,
      filterWardrobe,
    ]
  );

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const ctx = useContext(WardrobeContext);
  if (!ctx) throw new Error("useWardrobe must be used within WardrobeProvider");
  return ctx;
}

export type { Category, NewItemInput, ItemPatch };
