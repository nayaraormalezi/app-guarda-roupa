import React, { useMemo } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CreditCard, Eye, Repeat, Shirt, TrendingUp } from "lucide-react-native";
import { categoryLabel } from "@/data/catalog";
import { countCombinations } from "@/lib/outfit-engine";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function StatsScreen() {
  const { wardrobe } = useWardrobe();

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    wardrobe.forEach((i) => {
      const label = categoryLabel(i.category);
      map[label] = (map[label] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [wardrobe]);

  const mostUsed = useMemo(
    () => [...wardrobe].sort((a, b) => b.uses - a.uses).slice(0, 4),
    [wardrobe]
  );
  const forgotten = useMemo(
    () => [...wardrobe].sort((a, b) => a.uses - b.uses).slice(0, 5),
    [wardrobe]
  );

  const combos = countCombinations(wardrobe);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {[
            { label: "Total de peças", value: String(wardrobe.length), sub: "guarda-roupa", icon: Shirt },
            { label: "Combinações", value: String(combos), sub: "possíveis", icon: Repeat },
            {
              label: "Mais usada",
              value: `${mostUsed[0]?.uses ?? 0}×`,
              sub: mostUsed[0]?.name ?? "—",
              icon: TrendingUp,
            },
            {
              label: "Disponíveis",
              value: String(wardrobe.filter((i) => i.status === "available").length),
              sub: "prontas",
              icon: CreditCard,
            },
          ].map(({ label, value, sub, icon: Icon }) => (
            <View key={label} style={styles.kpi}>
              <View style={styles.icon}>
                <Icon size={14} color={colors.muted} />
              </View>
              <Text style={styles.kpiValue}>{value}</Text>
              <Text style={styles.kpiLabel}>{label}</Text>
              <Text style={styles.kpiSub} numberOfLines={1}>
                {sub}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Por categoria</Text>
          {byCategory.map(({ name, value }) => (
            <View key={name} style={styles.row}>
              <Text style={styles.rowName}>{name}</Text>
              <Text style={styles.rowVal}>{value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Mais utilizadas</Text>
          {mostUsed.map((item, i) => (
            <View key={item.id} style={styles.listRow}>
              <Text style={styles.rank}>{i + 1}</Text>
              <Image source={{ uri: item.img }} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemBrand}>{item.brand}</Text>
              </View>
              <Text style={styles.uses}>{item.uses}×</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.forgetHead}>
            <Text style={styles.section}>Peças esquecidas</Text>
            <Eye size={14} color={colors.soft} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {forgotten.map((item) => (
              <View key={item.id}>
                <Image source={{ uri: item.img }} style={styles.forgetImg} />
                <Text style={styles.forgetUses}>{item.uses}× usado</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, gap: 16, paddingBottom: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpi: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.creamDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  kpiValue: { fontFamily: fonts.monoMedium, fontSize: 20, color: colors.ink },
  kpiLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  kpiSub: { fontFamily: fonts.body, fontSize: 10, color: colors.soft, marginTop: 2 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20 },
  section: { fontFamily: fonts.displayMedium, fontSize: 17, color: colors.ink, marginBottom: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  rowName: { fontFamily: fonts.body, fontSize: 12, color: colors.ink },
  rowVal: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  listRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  rank: { fontFamily: fonts.mono, fontSize: 11, color: colors.soft, width: 14 },
  thumb: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.creamDark },
  itemName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  itemBrand: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted },
  uses: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink },
  forgetHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  forgetImg: { width: 80, height: 96, borderRadius: 16, backgroundColor: colors.creamDark },
  forgetUses: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.muted,
    textAlign: "center",
    marginTop: 6,
  },
});
