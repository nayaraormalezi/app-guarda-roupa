export type ThemeScheme = "light" | "dark";

interface ThemePalette {
  ink: string;
  muted: string;
  soft: string;
  gold: string;
  goldDark: string;
  cream: string;
  creamDark: string;
  creamWarm: string;
  white: string;
  border: string;
  borderStrong: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  /** Inverse text on dark/ink surfaces */
  onInk: string;
  tabBar: string;
  overlay: string;
  statusBar: "light" | "dark";
}

const light: ThemePalette = {
  ink: "#1C1917",
  muted: "#8C8278",
  soft: "#C4B8A8",
  gold: "#C4A97D",
  goldDark: "#8A6F3E",
  cream: "#F9F6F2",
  creamDark: "#F2EDE6",
  creamWarm: "#F8F2E8",
  white: "#FFFFFF",
  border: "rgba(28,25,23,0.08)",
  borderStrong: "rgba(28,25,23,0.12)",
  success: "#059669",
  successBg: "#ECFDF5",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  info: "#0284C7",
  infoBg: "#F0F9FF",
  /** Inverse text on dark/ink surfaces */
  onInk: "#FFFFFF",
  tabBar: "rgba(255,255,255,0.96)",
  overlay: "rgba(0,0,0,0.3)",
  statusBar: "dark" as const,
};

const dark: ThemePalette = {
  ink: "#F3EEE6",
  muted: "#A89F93",
  soft: "#6F675E",
  gold: "#C4A97D",
  goldDark: "#D4B98D",
  cream: "#12100E",
  creamDark: "#1A1714",
  creamWarm: "#1C1916",
  white: "#1E1B18",
  border: "rgba(243,238,230,0.08)",
  borderStrong: "rgba(243,238,230,0.14)",
  success: "#34D399",
  successBg: "#064E3B",
  warning: "#FBBF24",
  warningBg: "#451A03",
  info: "#38BDF8",
  infoBg: "#0C4A6E",
  onInk: "#12100E",
  tabBar: "rgba(30,27,24,0.96)",
  overlay: "rgba(0,0,0,0.55)",
  statusBar: "light" as const,
};

export type ThemeColors = ThemePalette;

export const lightColors: ThemeColors = light;
export const darkColors: ThemeColors = dark;

/** @deprecated Prefer useTheme().colors — kept as light default for static imports */
export const colors: ThemeColors = lightColors;

export function colorsForScheme(scheme: ThemeScheme): ThemeColors {
  return scheme === "dark" ? darkColors : lightColors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
