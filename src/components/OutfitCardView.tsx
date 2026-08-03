import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Outfit } from "@/data/types";
import { outfitPieces } from "@/lib/outfit-engine";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export function OutfitCardView({
  outfit,
  onSave,
  onSwap,
}: {
  outfit: Outfit;
  onSave?: () => void;
  onSwap?: () => void;
}) {
  const pieces = outfitPieces(outfit);
  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        {pieces.map(({ label, item }) => (
          <View key={`${label}-${item.id}`} style={styles.cell}>
            <Image source={{ uri: item.img }} style={styles.img} />
            <Text style={styles.label}>{label}</Text>
          </View>
        ))}
      </View>
      {(onSave || onSwap) && (
        <View style={styles.actions}>
          {onSave && (
            <Pressable style={styles.primary} onPress={onSave}>
              <Text style={styles.primaryText}>Salvar look</Text>
            </Pressable>
          )}
          {onSwap && (
            <Pressable style={styles.secondary} onPress={onSwap}>
              <Text style={styles.secondaryText}>Trocar peças</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: "hidden",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: "25%",
    backgroundColor: colors.white,
  },
  img: {
    width: "100%",
    height: 76,
    backgroundColor: colors.creamDark,
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.muted,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingVertical: 6,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
  },
  primary: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.white,
  },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.ink,
  },
});
