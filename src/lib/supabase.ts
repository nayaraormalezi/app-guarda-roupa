import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === "web") return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") return AsyncStorage.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") return AsyncStorage.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};

export function getSupabaseConfig() {
  const extra = Constants.expoConfig?.extra as
    | { supabaseUrl?: string; supabaseAnonKey?: string }
    | undefined;
  const url = (extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || "").trim();
  const anonKey = (extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  return { url, anonKey, enabled: Boolean(url && anonKey) };
}

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, enabled } = getSupabaseConfig();
  if (!enabled) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return client;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().enabled;
}
