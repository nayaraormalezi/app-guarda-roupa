import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  FORMALITIES,
  OCCASIONS,
  type FormalityId,
  type OccasionId,
} from "@/data/types";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export function LookContextPicker({
  occasionId,
  formalityId,
  onOccasionChange,
  onFormalityChange,
}: {
  occasionId: OccasionId;
  formalityId: FormalityId;
  onOccasionChange: (id: OccasionId) => void;
  onFormalityChange: (id: FormalityId) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const formality = FORMALITIES.find((f) => f.id === formalityId) ?? FORMALITIES[1];

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Ocasião</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {OCCASIONS.map((o) => {
          const on = o.id === occasionId;
          return (
            <Pressable
              key={o.id}
              onPress={() => onOccasionChange(o.id)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={styles.emoji}>{o.emoji}</Text>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.label, { marginTop: 14 }]}>Formalidade</Text>
      <View style={styles.formalityRow}>
        {FORMALITIES.map((f) => {
          const on = f.id === formalityId;
          return (
            <Pressable
              key={f.id}
              onPress={() => onFormalityChange(f.id)}
              style={[styles.formalityChip, on && styles.formalityOn]}
            >
              <Text style={[styles.formalityText, on && styles.formalityTextOn]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>{formality.hint}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  wrap: { gap: 8 },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  row: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  emoji: { fontSize: 13 },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted },
  chipTextOn: { color: colors.white },
  formalityRow: { flexDirection: "row", gap: 8 },
  formalityChip: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formalityOn: { backgroundColor: colors.creamWarm, borderColor: colors.gold },
  formalityText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.muted, textAlign: "center" },
  formalityTextOn: { color: colors.ink },
  hint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
    marginTop: 2,
  },
  });
}
