import React, { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";
import type { Preview } from "@storybook/react-native-web-vite";
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
    <View style={{ flex: 1, minHeight: "100vh" as unknown as number, backgroundColor: colors.cream, padding: 24 }}>
      {children}
    </View>
  );
}

function WithFonts({ children }: { children: ReactNode }) {
  const [loaded] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F9F6F2", minHeight: 240 }}>
        <ActivityIndicator color="#C4A97D" />
      </View>
    );
  }

  return <>{children}</>;
}

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
  },
  globalTypes: {
    theme: {
      description: "Aparência light / dark",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "system", title: "System" },
        ],
        dynamicTitle: true,
      },
    },
  },
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
};

export default preview;
