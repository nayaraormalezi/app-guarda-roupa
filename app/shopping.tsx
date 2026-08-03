import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertCircle, Heart, Sparkles, Trash2 } from "lucide-react-native";
import { getFormality } from "@/data/types";
import { wardrobeGaps } from "@/lib/outfit-engine";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function ShoppingScreen() {
  const { wardrobe, wishList, addWish, removeWish } = useWardrobe();
  const gaps = useMemo(() => wardrobeGaps(wardrobe), [wardrobe]);
  const wishGapIds = useMemo(() => new Set(wishList.map((w) => w.gapId).filter(Boolean)), [wishList]);

  const onAddWish = async (gapId: string) => {
    const gap = gaps.find((g) => g.id === gapId);
    if (!gap) return;
    if (wishGapIds.has(gap.id)) {
      Alert.alert("Já na lista", "Essa sugestão já está nos desejos.");
      return;
    }
    await addWish({
      label: gap.label,
      reason: gap.reason,
      categoryHint: gap.categoryHint,
      subcategoryHint: gap.subcategoryHint,
      formalityHint: gap.formalityHint,
      gapId: gap.id,
    });
    Alert.alert("Desejo salvo", "Adicionado à lista de desejos local.");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sub}>Sugestões a partir das lacunas reais do seu guarda-roupa</Text>

        <View style={styles.card}>
          <View style={styles.head}>
            <AlertCircle size={13} color={colors.gold} />
            <Text style={styles.headText}>Lacunas no guarda-roupa</Text>
          </View>
          {gaps.length === 0 ? (
            <Text style={styles.empty}>Seu closet cobre bem as bases principais. Continue assim.</Text>
          ) : (
            gaps.map((g) => (
              <View key={g.id} style={{ marginBottom: 12 }}>
                <View style={styles.row}>
                  <Text style={styles.label}>{g.label}</Text>
                  <Text style={styles.meta}>
                    {g.have}/{g.need}
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[styles.barFill, { width: `${Math.min(100, (g.have / g.need) * 100)}%` }]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        <Text style={styles.section}>Sugestões inteligentes</Text>
        {gaps.length === 0 ? (
          <Text style={styles.empty}>Nenhuma compra urgente no momento.</Text>
        ) : (
          gaps.map((item) => {
            const inWish = wishGapIds.has(item.id);
            const form =
              item.formalityHint === "todos"
                ? "versátil"
                : getFormality(item.formalityHint).label.toLowerCase();
            return (
              <View key={item.id} style={styles.product}>
                <View style={styles.productBody}>
                  <Text style={styles.brand}>{item.subcategoryHint}</Text>
                  <Text style={styles.name}>{item.label}</Text>
                  <Text style={styles.impact}>+{item.impactPct}% looks</Text>
                  <Text style={styles.reason}>{item.reason}</Text>
                  <Text style={styles.store}>
                    Foco: {form} · categoria {item.categoryHint}
                  </Text>
                  <Pressable
                    style={[styles.buy, inWish && styles.buyOn]}
                    onPress={() => onAddWish(item.id)}
                    disabled={inWish}
                  >
                    <Heart size={13} color={inWish ? colors.goldDark : colors.white} />
                    <Text style={[styles.buyText, inWish && { color: colors.goldDark }]}>
                      {inWish ? "Na lista de desejos" : "Adicionar ao desejo"}
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.note}>
                  <Sparkles size={11} color={colors.gold} />
                  <Text style={styles.noteText}>
                    Você tem {item.have} de {item.need} ideais. Completar essa lacuna aumenta as
                    combinações estimadas em ~{item.impactPct}%.
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.section}>Lista de desejos</Text>
        {wishList.length === 0 ? (
          <Text style={styles.empty}>Nenhum desejo ainda. Adicione a partir das sugestões.</Text>
        ) : (
          wishList.map((w) => (
            <View key={w.id} style={styles.wishRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{w.label}</Text>
                <Text style={styles.reason}>{w.reason}</Text>
              </View>
              <Pressable onPress={() => removeWish(w.id)} accessibilityLabel="Remover desejo">
                <Trash2 size={16} color={colors.muted} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, paddingBottom: 40 },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginBottom: 20 },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20, marginBottom: 28 },
  head: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  headText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  meta: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted },
  barBg: { height: 4, backgroundColor: colors.creamDark, borderRadius: 999, overflow: "hidden" },
  barFill: { height: 4, backgroundColor: colors.gold },
  section: { fontFamily: fonts.displayMedium, fontSize: 20, color: colors.ink, marginBottom: 16 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginBottom: 16 },
  product: { backgroundColor: colors.white, borderRadius: 24, overflow: "hidden", marginBottom: 16 },
  productBody: { padding: 16 },
  brand: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  name: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, marginTop: 4 },
  impact: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: colors.successBg,
    color: colors.success,
    fontFamily: fonts.mono,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  reason: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 18 },
  store: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 6 },
  buy: {
    marginTop: 12,
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  buyOn: { backgroundColor: colors.creamWarm, borderWidth: 1, borderColor: colors.gold },
  buyText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.white },
  note: {
    margin: 16,
    marginTop: 0,
    backgroundColor: colors.cream,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  noteText: { flex: 1, fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  wishRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
});
