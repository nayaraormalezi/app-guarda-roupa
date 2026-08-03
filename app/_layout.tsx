import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_400Regular_Italic,
} from "@expo-google-fonts/playfair-display";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from "@expo-google-fonts/dm-sans";
import { DMMono_400Regular, DMMono_500Medium } from "@expo-google-fonts/dm-mono";
import { WardrobeProvider, useWardrobe } from "@/store/wardrobe-store";
import { AuthProvider } from "@/store/auth-store";
import { SyncBridge } from "@/components/SyncBridge";
import { colors } from "@/theme/colors";
import "react-native-reanimated";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { ready, preferences } = useWardrobe();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const onOnboarding = segments[0] === "onboarding";
    if (!preferences.onboardingComplete && !onOnboarding) {
      router.replace("/onboarding");
    } else if (preferences.onboardingComplete && onOnboarding) {
      router.replace("/(tabs)");
    }
  }, [ready, preferences.onboardingComplete, segments, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <>
      <SyncBridge />
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.cream },
          headerTitleStyle: { fontFamily: "PlayfairDisplay_600SemiBold", fontSize: 18 },
        }}
      >
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
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <WardrobeProvider>
        <RootNavigator />
      </WardrobeProvider>
    </AuthProvider>
  );
}
