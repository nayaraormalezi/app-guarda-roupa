import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart2, ShoppingBag, Sparkles, User } from "lucide-react-native";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function MoreScreen() {
  const router = useRouter();
  const { savedLooks } = useWardrobe();

  const items = [
    {
      href: "/looks" as const,
      label: "Looks salvos",
      sub: `${savedLooks.length} look${savedLooks.length === 1 ? "" : "s"}`,
      icon: Sparkles,
      color: colors.creamWarm,
      ic: colors.gold,
    },
    {
      href: "/stats" as const,
      label: "Estatísticas",
      sub: "Dashboard",
      icon: BarChart2,
      color: colors.creamDark,
      ic: colors.muted,
    },
    {
      href: "/shopping" as const,
      label: "Compras",
      sub: "Inteligentes",
      icon: ShoppingBag,
      color: colors.creamWarm,
      ic: colors.gold,
    },
    {
      href: "/profile" as const,
      label: "Perfil",
      sub: "Configurações",
      icon: User,
      color: colors.creamDark,
      ic: colors.muted,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Mais</Text>
        <Text style={styles.title}>Menu</Text>
      </View>
      <View style={styles.grid}>
        {items.map(({ href, label, sub, icon: Icon, color, ic }) => (
          <Pressable key={label} style={styles.card} onPress={() => router.push(href)}>
            <View style={[styles.icon, { backgroundColor: color }]}>
              <Icon size={18} color={ic} />
            </View>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.sub}>{sub}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.premium}>
        <Text style={styles.premiumBadge}>{savedLooks.length ? "Seu estilo" : "Comece"}</Text>
        <Text style={styles.premiumTitle}>Closet, looks e sync.</Text>
        <Text style={styles.premiumSub}>
          Planeje a semana, peça looks no Stylist e sincronize a conta quando quiser.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink, marginTop: 4 },
  grid: {
    paddingHorizontal: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  premium: {
    marginHorizontal: 24,
    marginTop: 28,
    backgroundColor: colors.ink,
    borderRadius: 24,
    padding: 24,
  },
  premiumBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.gold,
    overflow: "hidden",
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  premiumTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.white,
    marginTop: 14,
  },
  premiumSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 6,
    lineHeight: 18,
  },
});
