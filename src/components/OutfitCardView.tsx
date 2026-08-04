import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { Outfit } from "@/data/types";
import { outfitPieces } from "@/lib/outfit-engine";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { radius } from "@/theme/colors";
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
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pieces = outfitPieces(outfit).slice(0, 4);
  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        {pieces.map(({ label, item }) => (
          <View key={`${label}-${item.id}`} style={styles.cell}>
            <Image source={{ uri: item.img }} style={styles.img} />
            <Text style={styles.cat}>{label.toUpperCase()}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        ))}
      </View>
      {(onSave || onSwap) && (
        <View style={styles.actions}>
          {onSave && (
            <Pressable style={styles.primary} onPress={onSave}>
              <Text style={styles.primaryText}>Aceitar look</Text>
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

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.cream,
      borderRadius: radius.card,
      overflow: "hidden",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    cell: {
      width: "48%",
      flexGrow: 1,
      backgroundColor: colors.white,
      borderRadius: radius.card,
      padding: 8,
      paddingBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    img: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: radius.input,
      backgroundColor: colors.creamDark,
    },
    cat: {
      marginTop: 8,
      fontFamily: fonts.bodyMedium,
      fontSize: 9,
      color: colors.muted,
      letterSpacing: 0.7,
    },
    name: {
      marginTop: 2,
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.ink,
    },
    actions: {
      flexDirection: "row",
      gap: 8,
      marginTop: 14,
    },
    primary: {
      flex: 1,
      backgroundColor: colors.ink,
      borderRadius: radius.button,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.white,
    },
    secondary: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: radius.button,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: colors.white,
    },
    secondaryText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.ink,
    },
  });
}
