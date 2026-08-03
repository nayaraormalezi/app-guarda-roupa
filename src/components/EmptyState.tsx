import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

interface Props {
  title: string;
  subtitle?: string;
  cta?: string;
  onPress?: () => void;
}

export function EmptyState({ title, subtitle, cta, onPress }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      {cta && onPress ? (
        <Pressable style={styles.cta} onPress={onPress}>
          <Text style={styles.ctaText}>{cta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: 18,
    color: colors.ink,
    textAlign: "center",
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 280,
  },
  cta: {
    marginTop: 10,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  ctaText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.white },
});
