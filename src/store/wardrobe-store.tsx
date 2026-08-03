import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
} from "@/data/types";
import {
  defaultFormalityFor,
  normalizeFormalityId,
  normalizeOccasionId,
  outfitToRefs,
} from "@/data/types";
import { buildWeekPlan } from "@/data/seed";
import { createId, deletePhotoIfLocal, loadState, savePhotoFromUri, saveState } from "@/lib/storage";
import { outfitPieceIds } from "@/lib/outfit-engine";
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
  weatherLoading: boolean;
  addItem: (input: NewItemInput) => Promise<ClothingItem>;
  updateItem: (id: string, patch: ItemPatch) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateItemStatus: (id: string, status: Status) => Promise<void>;
  incrementUses: (ids: string[]) => Promise<void>;
  setDayOccasion: (dayId: string, occasionId: OccasionId) => Promise<void>;
  setDayFormality: (dayId: string, formalityId: FormalityId) => Promise<void>;
  setDayOutfit: (dayId: string, outfit: Outfit | null) => Promise<void>;
  markDayUsed: (dayId: string, used?: boolean) => Promise<void>;
  resolveDayOutfit: (day: DayPlan) => Outfit | null;
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
  refreshTodayLook: (currentOutfit?: Outfit | null) => void;
  appendChatMessages: (msgs: ChatMessage[]) => Promise<void>;
  replaceChatMessages: (msgs: ChatMessage[]) => Promise<void>;
  addWish: (input: Omit<WishItem, "id" | "createdAt">) => Promise<WishItem>;
  removeWish: (id: string) => Promise<void>;
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

  const persist = useCallback(async (next: PersistedState) => {
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
      return { ...base, preferences: prefs };
    }
    try {
      setWeatherLoading(true);
      const days = await fetchWeekWeather(latitude, longitude);
      const merged = buildWeekPlan(
        new Date(),
        days.map((d) => ({
          weather: d.weather,
          temp: d.temp,
          tempMax: d.tempMax,
          tempMin: d.tempMin,
        }))
      ).map((day, i) => ({
        ...day,
        occasionId: normalizeOccasionId(base.weekPlan[i]?.occasionId ?? day.occasionId),
        formalityId: normalizeFormalityId(base.weekPlan[i]?.formalityId ?? day.formalityId),
        outfitRefs: base.weekPlan[i]?.outfitRefs,
        used: base.weekPlan[i]?.used,
      }));
      return { ...base, preferences: prefs, weekPlan: merged };
    } catch {
      return { ...base, preferences: prefs };
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let loaded = await loadState();
      if (loaded.preferences.onboardingComplete && loaded.preferences.latitude != null) {
        loaded = await applyWeather(loaded);
      }
      if (!mounted) return;
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

  const addItem = useCallback(
    async (input: NewItemInput) => {
      if (!state) throw new Error("Store not ready");
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
      await persist({ ...state, wardrobe: [item, ...state.wardrobe] });
      return item;
    },
    [persist, state]
  );

  const updateItem = useCallback(
    async (id: string, patch: ItemPatch) => {
      if (!state) return;
      await persist({
        ...state,
        wardrobe: state.wardrobe.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      });
    },
    [persist, state]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!state) return;
      const item = state.wardrobe.find((i) => i.id === id);
      if (item) await deletePhotoIfLocal(item.img);
      await persist({
        ...state,
        wardrobe: state.wardrobe.filter((i) => i.id !== id),
        savedLooks: state.savedLooks.map((look) => ({
          ...look,
          pieces: Object.fromEntries(
            Object.entries(look.pieces).map(([k, v]) => [k, v === id ? undefined : v])
          ) as SavedLook["pieces"],
        })),
      });
    },
    [persist, state]
  );

  const updateItemStatus = useCallback(
    async (id: string, status: Status) => {
      await updateItem(id, { status });
    },
    [updateItem]
  );

  const incrementUses = useCallback(
    async (ids: string[]) => {
      if (!state || !ids.length) return;
      const set = new Set(ids);
      await persist({
        ...state,
        wardrobe: state.wardrobe.map((i) => (set.has(i.id) ? { ...i, uses: i.uses + 1 } : i)),
      });
    },
    [persist, state]
  );

  const setDayOccasion = useCallback(
    async (dayId: string, occasionId: OccasionId) => {
      if (!state) return;
      const normalized = normalizeOccasionId(occasionId);
      await persist({
        ...state,
        weekPlan: state.weekPlan.map((d) =>
          d.id === dayId
            ? { ...d, occasionId: normalized, formalityId: defaultFormalityFor(normalized) }
            : d
        ),
      });
    },
    [persist, state]
  );

  const setDayFormality = useCallback(
    async (dayId: string, formalityId: FormalityId) => {
      if (!state) return;
      await persist({
        ...state,
        weekPlan: state.weekPlan.map((d) =>
          d.id === dayId ? { ...d, formalityId: normalizeFormalityId(formalityId) } : d
        ),
      });
    },
    [persist, state]
  );

  const setDayOutfit = useCallback(
    async (dayId: string, outfit: Outfit | null) => {
      if (!state) return;
      await persist({
        ...state,
        weekPlan: state.weekPlan.map((d) =>
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
    [persist, state]
  );

  const markDayUsed = useCallback(
    async (dayId: string, used = true) => {
      if (!state) return;
      const day = state.weekPlan.find((d) => d.id === dayId);
      const ids = day?.outfitRefs
        ? (Object.values(day.outfitRefs).filter(Boolean) as string[])
        : [];
      await persist({
        ...state,
        weekPlan: state.weekPlan.map((d) => (d.id === dayId ? { ...d, used } : d)),
        wardrobe:
          used && ids.length
            ? state.wardrobe.map((i) => (ids.includes(i.id) ? { ...i, uses: i.uses + 1 } : i))
            : state.wardrobe,
      });
    },
    [persist, state]
  );

  const updatePreferences = useCallback(
    async (patch: Partial<AppPreferences>) => {
      if (!state) return;
      await persist({
        ...state,
        preferences: { ...state.preferences, ...patch },
      });
    },
    [persist, state]
  );

  const completeOnboarding = useCallback(
    async (prefs: {
      displayName: string;
      city: string;
      styleTags: string[];
      latitude: number;
      longitude: number;
    }) => {
      if (!state) return;
      let next: PersistedState = {
        ...state,
        preferences: {
          ...state.preferences,
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
    [applyWeather, persist, state]
  );

  const saveLook = useCallback(
    async (
      outfit: Outfit,
      name?: string,
      occasionId?: OccasionId,
      formalityId?: FormalityId
    ) => {
      if (!state) throw new Error("Store not ready");
      const look: SavedLook = {
        id: createId(),
        name: name?.trim() || `Look ${new Date().toLocaleDateString("pt-BR")}`,
        createdAt: Date.now(),
        occasionId,
        formalityId,
        pieces: outfitToRefs(outfit),
      };
      const ids = Object.values(look.pieces).filter(Boolean) as string[];
      await persist({
        ...state,
        savedLooks: [look, ...state.savedLooks],
        wardrobe: state.wardrobe.map((i) => (ids.includes(i.id) ? { ...i, uses: i.uses + 1 } : i)),
      });
      return look;
    },
    [persist, state]
  );

  const deleteLook = useCallback(
    async (id: string) => {
      if (!state) return;
      await persist({
        ...state,
        savedLooks: state.savedLooks.filter((l) => l.id !== id),
      });
    },
    [persist, state]
  );

  const resolveLook = useCallback(
    (look: SavedLook): Outfit => resolveOutfitRefs(look.pieces),
    [resolveOutfitRefs]
  );

  const refreshWeather = useCallback(
    async (prefsOverride?: Partial<AppPreferences>) => {
      if (!state) return;
      const base = prefsOverride
        ? { ...state, preferences: { ...state.preferences, ...prefsOverride } }
        : state;
      const next = await applyWeather(base);
      await persist(next);
    },
    [applyWeather, persist, state]
  );

  const refreshTodayLook = useCallback((currentOutfit?: Outfit | null) => {
    if (currentOutfit) {
      setTodayExcludeIds(outfitPieceIds(currentOutfit));
    }
    setTodayLookVariant((v) => v + 1);
  }, []);

  const appendChatMessages = useCallback(
    async (msgs: ChatMessage[]) => {
      if (!state || !msgs.length) return;
      const slim = msgs.map((m) => ({
        ...m,
        outfit: undefined,
        outfitRefs: m.outfitRefs ?? (m.outfit ? outfitToRefs(m.outfit) : undefined),
      }));
      await persist({ ...state, chatMessages: [...state.chatMessages, ...slim].slice(-80) });
    },
    [persist, state]
  );

  const replaceChatMessages = useCallback(
    async (msgs: ChatMessage[]) => {
      if (!state) return;
      await persist({ ...state, chatMessages: msgs.slice(-80) });
    },
    [persist, state]
  );

  const addWish = useCallback(
    async (input: Omit<WishItem, "id" | "createdAt">) => {
      if (!state) throw new Error("Store not ready");
      const item: WishItem = { ...input, id: createId(), createdAt: Date.now() };
      await persist({ ...state, wishList: [item, ...state.wishList] });
      return item;
    },
    [persist, state]
  );

  const removeWish = useCallback(
    async (id: string) => {
      if (!state) return;
      await persist({ ...state, wishList: state.wishList.filter((w) => w.id !== id) });
    },
    [persist, state]
  );

  const replacePersistedState = useCallback(
    async (next: PersistedState) => {
      await persist(next);
    },
    [persist]
  );

  const getPersistedSnapshot = useCallback((): PersistedState => {
    return (
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
      weatherLoading,
      addItem,
      updateItem,
      deleteItem,
      updateItemStatus,
      incrementUses,
      setDayOccasion,
      setDayFormality,
      setDayOutfit,
      markDayUsed,
      resolveDayOutfit,
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
      markDayUsed,
      resolveDayOutfit,
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
