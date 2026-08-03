import { TextStyle } from "react-native";
import { colors } from "./colors";

export const fonts = {
  display: "PlayfairDisplay_600SemiBold",
  displayMedium: "PlayfairDisplay_500Medium",
  displayItalic: "PlayfairDisplay_400Regular_Italic",
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodySemi: "DMSans_600SemiBold",
  mono: "DMMono_400Regular",
  monoMedium: "DMMono_500Medium",
} as const;

export const typography = {
  hero: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
    lineHeight: 40,
  } satisfies TextStyle,
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
  } satisfies TextStyle,
  section: {
    fontFamily: fonts.displayMedium,
    fontSize: 22,
    color: colors.ink,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
  } satisfies TextStyle,
  bodyMuted: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
  } satisfies TextStyle,
  mono: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
  } satisfies TextStyle,
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
  } satisfies TextStyle,
} as const;
