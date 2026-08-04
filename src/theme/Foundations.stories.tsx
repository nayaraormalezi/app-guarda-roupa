import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { lightColors, darkColors, spacing } from "@/theme/colors";
import { fonts, typography } from "@/theme/typography";

function ColorSwatch({ name, value }: { name: string; value: string }) {
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: value }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.swatchName}>{name}</Text>
        <Text style={styles.swatchValue}>{value}</Text>
      </View>
    </View>
  );
}

function Foundations() {
  const { colors, scheme } = useTheme();
  const palette = scheme === "dark" ? darkColors : lightColors;
  const entries = Object.entries(palette).filter(([, v]) => typeof v === "string");

  return (
    <ScrollView contentContainerStyle={{ gap: 24, paddingBottom: 40 }}>
      <View>
        <Text style={[typography.section, { color: colors.ink }]}>Color</Text>
        <Text style={[typography.bodyMuted, { marginBottom: 12 }]}>
          Semantic tokens — modo {scheme}
        </Text>
        {entries.map(([name, value]) => (
          <ColorSwatch key={name} name={name} value={value as string} />
        ))}
      </View>

      <View>
        <Text style={[typography.section, { color: colors.ink }]}>Typography</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 34, color: colors.ink, marginTop: 8 }}>
          Display · Playfair
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink, marginTop: 8 }}>
          Body · DM Sans Regular
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink, marginTop: 4 }}>
          Body Medium · DM Sans Medium
        </Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 8 }}>
          MONO · DM MONO LABEL
        </Text>
      </View>

      <View>
        <Text style={[typography.section, { color: colors.ink }]}>Spacing</Text>
        {Object.entries(spacing).map(([name, value]) => (
          <View key={name} style={styles.spaceRow}>
            <View style={[styles.spaceBar, { width: value, backgroundColor: colors.gold }]} />
            <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted }}>
              {name} · {value}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  swatchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.08)",
  },
  swatchName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: "#1C1917" },
  swatchValue: { fontFamily: fonts.mono, fontSize: 10, marginTop: 2, color: "#8C8278" },
  spaceRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  spaceBar: { height: 12, borderRadius: 4 },
});

const meta = {
  title: "Foundations/Tokens",
  component: Foundations,
} satisfies Meta<typeof Foundations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
