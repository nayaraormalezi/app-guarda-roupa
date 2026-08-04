import React, { useMemo, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart2, BookOpen, ShoppingBag, Sparkles, Tag, User } from "lucide-react-native";
import { useWardrobe } from "@/store/wardrobe-store";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const SCREEN_W = Dimensions.get("window").width;
const CARD_W = SCREEN_W - 64;
const CARD_GAP = 12;

/** Placeholder promos — department-store look offers (not live yet). */
const PROMO_CARDS = [
  {
    id: "renner",
    store: "Renner",
    title: "Looks de trabalho com até 40% off",
    sub: "Blazers, calças e camisas selecionadas",
    accent: "#1C1917",
  },
  {
    id: "cea",
    store: "C&A",
    title: "Casual do dia a partir de R$ 79",
    sub: "Peças para completar o guarda-roupa",
    accent: "#0B3D5C",
  },
  {
    id: "riachuelo",
    store: "Riachuelo",
    title: "Formalidade leve em promoção",
    sub: "Sugestões alinhadas ao seu estilo",
    accent: "#5C3A1E",
  },
  {
    id: "zara",
    store: "Zara",
    title: "Novidades da temporada",
    sub: "Em breve: ofertas personalizadas para você",
    accent: "#2A2A2A",
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const { savedLooks } = useWardrobe();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [promoIndex, setPromoIndex] = useState(0);

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
    ...(__DEV__
      ? [
          {
            href: "/storybook" as const,
            label: "Storybook",
            sub: "Design system",
            icon: BookOpen,
            color: colors.creamWarm,
            ic: colors.gold,
          },
        ]
      : []),
  ];

  const onPromoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / (CARD_W + CARD_GAP));
    if (idx !== promoIndex && idx >= 0 && idx < PROMO_CARDS.length) {
      setPromoIndex(idx);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Mais</Text>
          <Text style={styles.title}>Menu</Text>
        </View>

        <View style={styles.promoBlock}>
          <View style={styles.promoHead}>
            <Text style={styles.promoEyebrow}>Ofertas para looks</Text>
            <Text style={styles.promoHint}>Em breve</Text>
          </View>
          <ScrollView
            horizontal
            pagingEnabled={false}
            decelerationRate="fast"
            snapToInterval={CARD_W + CARD_GAP}
            snapToAlignment="start"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promoRow}
            onScroll={onPromoScroll}
            scrollEventThrottle={16}
          >
            {PROMO_CARDS.map((promo) => (
              <Pressable
                key={promo.id}
                style={[styles.promoCard, { backgroundColor: promo.accent }]}
                onPress={() => router.push("/shopping")}
              >
                <View style={styles.promoTop}>
                  <View style={styles.promoTag}>
                    <Tag size={10} color={colors.ink} />
                    <Text style={styles.promoTagText}>{promo.store}</Text>
                  </View>
                  <Text style={styles.promoSoon}>Placeholder</Text>
                </View>
                <Text style={styles.promoTitle}>{promo.title}</Text>
                <Text style={styles.promoSub}>{promo.sub}</Text>
                <View style={styles.promoFooter}>
                  <Text style={styles.promoCta}>Ver lojas favoritas</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {PROMO_CARDS.map((p, i) => (
              <View key={p.id} style={[styles.dot, i === promoIndex && styles.dotOn]} />
            ))}
          </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  page: { paddingBottom: 40 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink, marginTop: 4 },
  promoBlock: { marginBottom: 20 },
  promoHead: {
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  promoEyebrow: {
    fontFamily: fonts.displayMedium,
    fontSize: 17,
    color: colors.ink,
  },
  promoHint: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  promoRow: { paddingHorizontal: 24, gap: CARD_GAP },
  promoCard: {
    width: CARD_W,
    borderRadius: 22,
    padding: 20,
    minHeight: 168,
    justifyContent: "space-between",
  },
  promoTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  promoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  promoTagText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.ink,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  promoSoon: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  promoTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.white,
    lineHeight: 26,
  },
  promoSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    marginTop: 8,
    lineHeight: 18,
  },
  promoFooter: { marginTop: 18 },
  promoCta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.gold,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.creamDark,
  },
  dotOn: { backgroundColor: colors.gold, width: 16 },
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
  });
}
