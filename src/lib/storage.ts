import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { normalizeCategory, normalizeFormality } from "@/data/catalog";
import type { AppPreferences, ChatMessage, ClothingItem, PersistedState, WishItem } from "@/data/types";
import { buildWeekPlan, DEFAULT_PREFERENCES, normalizeDayPlan, SEED_WARDROBE } from "@/data/seed";

const STORAGE_KEY = "@personal_stylist/v2";
const PHOTO_DIR = `${FileSystem.documentDirectory}wardrobe/`;

function normalizePreferences(raw?: Partial<AppPreferences> | null): AppPreferences {
  if (!raw) return { ...DEFAULT_PREFERENCES };
  const migrated =
    raw.onboardingComplete === undefined && Boolean(raw.displayName && raw.city);
  return {
    displayName: raw.displayName ?? "",
    city: raw.city ?? "",
    styleTags: raw.styleTags ?? [],
    onboardingComplete: raw.onboardingComplete ?? migrated,
    latitude: raw.latitude,
    longitude: raw.longitude,
  };
}

function normalizeItem(item: ClothingItem): ClothingItem {
  const category = normalizeCategory(String(item.category));
  return {
    ...item,
    category,
    formality: normalizeFormality(item.formality as string | undefined),
    tall:
      item.tall ??
      (category === "superiores" ||
        category === "vestidos" ||
        category === "macacoes" ||
        category === "casacos"),
  };
}

function defaultWelcome(displayName: string): ChatMessage {
  return {
    id: "welcome",
    role: "ai",
    text: `Olá${displayName ? `, ${displayName}` : ""}. Sou sua stylist pessoal. Peça um look e eu monto com peças do seu guarda-roupa.`,
  };
}

function emptyState(): PersistedState {
  const seed = __DEV__ || process.env.EXPO_PUBLIC_USE_SEED === "1";
  return {
    wardrobe: seed ? SEED_WARDROBE : [],
    weekPlan: buildWeekPlan(),
    preferences: { ...DEFAULT_PREFERENCES },
    savedLooks: [],
    chatMessages: [defaultWelcome("")],
    wishList: [],
    seeded: seed,
  };
}

export async function loadState(): Promise<PersistedState> {
  try {
    const raw =
      (await AsyncStorage.getItem(STORAGE_KEY)) ??
      (await AsyncStorage.getItem("@personal_stylist/v1"));
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    const weekPlan = (parsed.weekPlan?.length ? parsed.weekPlan : buildWeekPlan()).map((d) =>
      normalizeDayPlan(d)
    );
    const wardrobe = (
      parsed.wardrobe?.length
        ? parsed.wardrobe
        : __DEV__ || process.env.EXPO_PUBLIC_USE_SEED === "1"
          ? SEED_WARDROBE
          : []
    ).map(normalizeItem);
    const preferences = normalizePreferences(parsed.preferences);
    const chatMessages =
      parsed.chatMessages && parsed.chatMessages.length > 0
        ? parsed.chatMessages
        : [defaultWelcome(preferences.displayName)];
    return {
      wardrobe,
      weekPlan,
      preferences,
      savedLooks: parsed.savedLooks ?? [],
      chatMessages,
      wishList: (parsed.wishList as WishItem[] | undefined) ?? [],
      seeded: true,
    };
  } catch {
    return emptyState();
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function savePhotoFromUri(uri: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const dest = `${PHOTO_DIR}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

export async function deletePhotoIfLocal(uri: string): Promise<void> {
  if (!uri.startsWith("file://") && !uri.includes("/wardrobe/")) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // ignore
  }
}

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
