import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { lightColors, darkColors, spacing, radius } from "@/theme/colors";
import { fonts, typography } from "@/theme/typography";

function ColorSwatch({ name, value }: { name: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.swatchRow}>
      <View style={[styles.swatch, { backgroundColor: value, borderColor: colors.border }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.swatchName, { color: colors.ink }]}>{name}</Text>
        <Text style={[styles.swatchValue, { color: colors.muted }]}>{value}</Text>
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
        <Text style={[typography.h3, { color: colors.ink }]}>Vestia · Color</Text>
        <Text style={[typography.caption, { marginBottom: 16 }]}>
          Semantic tokens — modo {scheme}
        </Text>
        {entries.map(([name, value]) => (
          <ColorSwatch key={name} name={name} value={value as string} />
        ))}
      </View>

      <View>
        <Text style={[typography.h3, { color: colors.ink }]}>Typography</Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 40, color: colors.ink, marginTop: 8 }}>
          H1 · Playfair
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 16, color: colors.ink, marginTop: 8 }}>
          Body Large · Inter 16
        </Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.ink, marginTop: 4 }}>
          Body · Inter 14
        </Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted, marginTop: 8, letterSpacing: 1 }}>
          CAPTION LABEL
        </Text>
      </View>

      <View>
        <Text style={[typography.h3, { color: colors.ink }]}>Spacing · 8pt</Text>
        {Object.entries(spacing).map(([name, value]) => (
          <View key={name} style={styles.spaceRow}>
            <View style={[styles.spaceBar, { width: value, backgroundColor: colors.gold }]} />
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted }}>
              {name} · {value}
            </Text>
          </View>
        ))}
      </View>

      <View>
        <Text style={[typography.h3, { color: colors.ink }]}>Radius</Text>
        {Object.entries(radius).map(([name, value]) => (
          <View key={name} style={styles.spaceRow}>
            <View
              style={{
                width: 48,
                height: 32,
                backgroundColor: colors.creamDark,
                borderRadius: value === 999 ? 16 : Math.min(value, 16),
              }}
            />
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted }}>
              {name} · {value}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  swatchRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 8 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  swatchName: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  swatchValue: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  spaceRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },
  spaceBar: { height: 8, borderRadius: 4 },
});

const meta = {
  title: "Foundations/Tokens",
  component: Foundations,
} satisfies Meta<typeof Foundations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
