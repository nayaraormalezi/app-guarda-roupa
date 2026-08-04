import React, { useCallback, useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_400Regular_Italic,
} from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { WardrobeProvider, useWardrobe } from "@/store/wardrobe-store";
import { AuthProvider, useAuth } from "@/store/auth-store";
import { SyncBridge } from "@/components/SyncBridge";
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";
import type { ThemePreference } from "@/data/types";
import "react-native-reanimated";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

function ThemedRoot({ children }: { children: React.ReactNode }) {
  const { preferences, updatePreferences, ready } = useWardrobe();
  const preference = preferences.theme ?? "system";

  const onPreferenceChange = useCallback(
    (next: ThemePreference) => {
      void updatePreferences({ theme: next });
    },
    [updatePreferences]
  );

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F6" }}>
        <ActivityIndicator color="#C8A97E" />
      </View>
    );
  }

  return (
    <ThemeProvider preference={preference} onPreferenceChange={onPreferenceChange}>
      {children}
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { ready, preferences, updatePreferences } = useWardrobe();
  const { user, loading: authLoading } = useAuth();
  const { colors, scheme } = useTheme();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (ready && !authLoading) SplashScreen.hideAsync();
  }, [ready, authLoading]);

  useEffect(() => {
    if (!ready || authLoading || !user) return;
    if (!preferences.onboardingComplete) {
      void updatePreferences({ onboardingComplete: true });
    }
  }, [ready, authLoading, user, preferences.onboardingComplete, updatePreferences]);

  useEffect(() => {
    if (!ready || authLoading) return;
    const onOnboarding = segments[0] === "onboarding";
    const needsOnboarding = !preferences.onboardingComplete && !user;

    if (needsOnboarding && !onOnboarding) {
      router.replace("/onboarding");
    } else if (!needsOnboarding && onOnboarding) {
      router.replace("/(tabs)");
    }
  }, [ready, authLoading, preferences.onboardingComplete, user, segments, router]);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: { backgroundColor: colors.cream },
      headerTintColor: colors.ink,
      headerStyle: { backgroundColor: colors.cream },
      headerTitleStyle: { fontFamily: "PlayfairDisplay_600SemiBold" as const, fontSize: 18, color: colors.ink },
      headerShadowVisible: false,
    }),
    [colors]
  );

  if (!ready || authLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <>
      <SyncBridge />
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="planning" options={{ headerShown: true, title: "Esta semana", headerBackTitle: "Voltar" }} />
        <Stack.Screen name="shopping" options={{ headerShown: true, title: "Compras", headerBackTitle: "Voltar" }} />
        <Stack.Screen name="stats" options={{ headerShown: true, title: "Estatísticas", headerBackTitle: "Voltar" }} />
        <Stack.Screen name="profile" options={{ headerShown: true, title: "Perfil", headerBackTitle: "Voltar" }} />
        <Stack.Screen name="account" options={{ headerShown: true, title: "Conta", headerBackTitle: "Voltar" }} />
        <Stack.Screen name="looks" options={{ headerShown: true, title: "Looks salvos", headerBackTitle: "Voltar" }} />
        <Stack.Screen name="privacy" options={{ headerShown: true, title: "Privacidade", headerBackTitle: "Voltar" }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: "Notificações", headerBackTitle: "Voltar" }} />
        <Stack.Screen name="piece/[id]" options={{ headerShown: true, title: "Peça", headerBackTitle: "Voltar" }} />
        <Stack.Screen
          name="look/today"
          options={{ headerShown: true, title: "Look de hoje", headerBackTitle: "Voltar" }}
        />
        <Stack.Screen name="look/[id]" options={{ headerShown: true, title: "Look", headerBackTitle: "Voltar" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <WardrobeProvider>
          <ThemedRoot>
            <RootNavigator />
          </ThemedRoot>
        </WardrobeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
