import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import type { ThemePreference } from "@/data/types";
import type { ThemeColors, ThemeScheme } from "@/theme/colors";
import { colorsForScheme } from "@/theme/colors";

interface ThemeContextValue {
  preference: ThemePreference;
  scheme: ThemeScheme;
  colors: ThemeColors;
  setPreference: (next: ThemePreference) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(preference: ThemePreference, system: ThemeScheme | null | undefined): ThemeScheme {
  if (preference === "light" || preference === "dark") return preference;
  return system === "dark" ? "dark" : "light";
}

export function ThemeProvider({
  preference,
  onPreferenceChange,
  children,
}: {
  preference: ThemePreference;
  onPreferenceChange: (next: ThemePreference) => void;
  children: ReactNode;
}) {
  const system = useColorScheme();
  const [systemScheme, setSystemScheme] = useState<ThemeScheme>(system === "dark" ? "dark" : "light");

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === "dark" ? "dark" : "light");
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setSystemScheme(system === "dark" ? "dark" : "light");
  }, [system]);

  const scheme = resolveScheme(preference, systemScheme);
  const colors = useMemo(() => colorsForScheme(scheme), [scheme]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      onPreferenceChange(next);
    },
    [onPreferenceChange]
  );

  const value = useMemo(
    () => ({
      preference,
      scheme,
      colors,
      setPreference,
      isDark: scheme === "dark",
    }),
    [preference, scheme, colors, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback before provider mounts
    return {
      preference: "system" as ThemePreference,
      scheme: "light" as ThemeScheme,
      colors: colorsForScheme("light"),
      setPreference: () => undefined,
      isDark: false,
    };
  }
  return ctx;
}
