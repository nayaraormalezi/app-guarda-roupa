import { TextStyle } from "react-native";
import { colors } from "./colors";

/**
 * Vestia type system — Playfair Display + Inter only.
 * `mono` / `monoMedium` map to Inter (letter-spaced labels) to keep max 2 families.
 */
export const fonts = {
  display: "PlayfairDisplay_600SemiBold",
  displayMedium: "PlayfairDisplay_500Medium",
  displayItalic: "PlayfairDisplay_400Regular_Italic",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  /** @deprecated Prefer body — kept for labels previously on DM Mono */
  mono: "Inter_500Medium",
  monoMedium: "Inter_600SemiBold",
} as const;

export const typography = {
  h1: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.ink,
    lineHeight: 48,
  } satisfies TextStyle,
  h2: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.ink,
    lineHeight: 40,
  } satisfies TextStyle,
  h3: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
    lineHeight: 32,
  } satisfies TextStyle,
  h4: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.ink,
    lineHeight: 28,
  } satisfies TextStyle,
  /** @deprecated Prefer h1 */
  hero: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.ink,
    lineHeight: 48,
  } satisfies TextStyle,
  /** @deprecated Prefer h2 */
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.ink,
  } satisfies TextStyle,
  /** @deprecated Prefer h3 */
  section: {
    fontFamily: fonts.displayMedium,
    fontSize: 24,
    color: colors.ink,
  } satisfies TextStyle,
  bodyLarge: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 24,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 20,
  } satisfies TextStyle,
  bodyMuted: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  } satisfies TextStyle,
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  } satisfies TextStyle,
  /** Uppercase micro-label (was mono) */
  mono: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  } satisfies TextStyle,
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  } satisfies TextStyle,
} as const;
