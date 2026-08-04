import React, { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import type { Preview } from "@storybook/react-native";
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
import { ThemeProvider, useTheme } from "@/theme/ThemeContext";
import type { ThemePreference } from "@/data/types";

function StoryShell({
  theme,
  children,
}: {
  theme: ThemePreference;
  children: ReactNode;
}) {
  const [preference, setPreference] = useState<ThemePreference>(theme);

  useEffect(() => {
    setPreference(theme);
  }, [theme]);

  return (
    <ThemeProvider preference={preference} onPreferenceChange={setPreference}>
      <ThemedCanvas>{children}</ThemedCanvas>
    </ThemeProvider>
  );
}

function ThemedCanvas({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream, padding: 16 }}>
      {children}
    </View>
  );
}

function WithFonts({ children }: { children: ReactNode }) {
  const [loaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF8F6" }}>
        <ActivityIndicator color="#C8A97E" />
      </View>
    );
  }

  return <>{children}</>;
}

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const theme = (context.globals.theme as ThemePreference) ?? "light";
      return (
        <WithFonts>
          <StoryShell theme={theme}>
            <Story />
          </StoryShell>
        </WithFonts>
      );
    },
  ],
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Aparência light / dark",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "system", title: "System" },
        ],
      },
    },
  },
};

export default preview;
