export type ThemeScheme = "light" | "dark";

/**
 * Vestia semantic palette — see docs/VESTIA_DESIGN_CONSTITUTION.md
 */
interface ThemePalette {
  /** Primary text / CTA fill */
  ink: string;
  /** Secondary / muted text */
  muted: string;
  /** Soft decorative (inactive icons) */
  soft: string;
  /** Secondary brand (gold) */
  gold: string;
  goldDark: string;
  /** App background */
  cream: string;
  /** Accent surface / soft fill */
  creamDark: string;
  creamWarm: string;
  /** Elevated surface */
  white: string;
  border: string;
  borderStrong: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;
  error: string;
  errorBg: string;
  /** Inverse text on dark/ink surfaces */
  onInk: string;
  tabBar: string;
  overlay: string;
  statusBar: "light" | "dark";
}

const light: ThemePalette = {
  ink: "#121212",
  muted: "#8E8A83",
  soft: "#C8A97E",
  gold: "#C8A97E",
  goldDark: "#A88B5E",
  cream: "#FAF8F6",
  creamDark: "#EDE5DA",
  creamWarm: "#EDE5DA",
  white: "#FFFFFF",
  border: "#ECE7E2",
  borderStrong: "#E3DDD6",
  success: "#7C9B83",
  successBg: "#F0F5F1",
  warning: "#B8965A",
  warningBg: "#F7F1E8",
  info: "#8E8A83",
  infoBg: "#F3F1EE",
  error: "#B96A6A",
  errorBg: "#F8EEEE",
  onInk: "#FFFFFF",
  tabBar: "rgba(255,255,255,0.96)",
  overlay: "rgba(18,18,18,0.28)",
  statusBar: "dark" as const,
};

/** Calm dark derived from the same constitution (constitution defines light first). */
const dark: ThemePalette = {
  ink: "#FAF8F6",
  muted: "#A8A49C",
  soft: "#6F6B64",
  gold: "#C8A97E",
  goldDark: "#D4B98D",
  cream: "#121212",
  creamDark: "#1C1C1C",
  creamWarm: "#22201C",
  white: "#1A1A1A",
  border: "rgba(250,248,246,0.10)",
  borderStrong: "rgba(250,248,246,0.16)",
  success: "#7C9B83",
  successBg: "#1A2420",
  warning: "#C8A97E",
  warningBg: "#2A2418",
  info: "#A8A49C",
  infoBg: "#1C1C1C",
  error: "#B96A6A",
  errorBg: "#2A1818",
  onInk: "#121212",
  tabBar: "rgba(26,26,26,0.96)",
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

/** 8-point spacing scale — constitution allows only these steps. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  huge: 64,
} as const;

/** Corner radii from the constitution. */
export const radius = {
  input: 16,
  card: 24,
  sheet: 32,
  button: 999,
} as const;
