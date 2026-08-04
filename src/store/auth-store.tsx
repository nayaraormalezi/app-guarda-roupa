import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { mergeLocalAndCloud, pullStateFromCloud, pushStateToCloud } from "@/lib/sync";
import type { PersistedState } from "@/data/types";

interface AuthContextValue {
  configured: boolean;
  session: Session | null;
  user: User | null;
  loading: boolean;
  syncing: boolean;
  lastSyncAt: number | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: (local: PersistedState) => Promise<PersistedState | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session) setSession(data.session);
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase não configurado");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName ?? "" } },
      });
      if (error) throw error;
      if (data.session) setSession(data.session);
    },
    []
  );

  const signInWithApple = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase não configurado");
    if (Platform.OS !== "ios") throw new Error("Apple Sign In só no iOS");
    const rawNonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      rawNonce
    );
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) throw new Error("Token Apple ausente");
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "apple",
      token: credential.identityToken,
      nonce: rawNonce,
    });
    if (error) throw error;
    if (data.session) setSession(data.session);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const syncNow = useCallback(
    async (local: PersistedState): Promise<PersistedState | null> => {
      const supabase = getSupabase();
      if (!supabase) return null;
      // Prefer live auth session — React state can lag right after login
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id ?? session?.user?.id;
      if (!userId) return null;
      setSyncing(true);
      try {
        const cloud = await pullStateFromCloud(userId);
        const merged = cloud ? mergeLocalAndCloud(local, cloud) : local;
        await pushStateToCloud(merged, userId);
        setLastSyncAt(Date.now());
        return merged;
      } finally {
        setSyncing(false);
      }
    },
    [session?.user?.id]
  );

  const value = useMemo(
    () => ({
      configured,
      session,
      user: session?.user ?? null,
      loading,
      syncing,
      lastSyncAt,
      signInWithEmail,
      signUpWithEmail,
      signInWithApple,
      signOut,
      syncNow,
    }),
    [
      configured,
      session,
      loading,
      syncing,
      lastSyncAt,
      signInWithEmail,
      signUpWithEmail,
      signInWithApple,
      signOut,
      syncNow,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
