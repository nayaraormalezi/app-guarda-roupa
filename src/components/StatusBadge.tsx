import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import type { Status } from "@/data/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const MAP: Record<Status, { label: string; color: string; bg: string }> = {
  available: { label: "Disponível", color: colors.success, bg: colors.successBg },
  washing: { label: "Lavando", color: colors.warning, bg: colors.warningBg },
  borrowed: { label: "Emprestada", color: colors.info, bg: colors.infoBg },
};

export function StatusBadge({ status }: { status: Status }) {
  const s = MAP[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export function PieceThumb({
  uri,
  size = 64,
  radius = 14,
}: {
  uri: string;
  size?: number;
  radius?: number;
}) {
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.creamDark }}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.monoMedium,
    fontSize: 9,
    letterSpacing: 0.4,
  },
});
