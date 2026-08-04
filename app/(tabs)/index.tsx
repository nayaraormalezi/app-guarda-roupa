import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarChart2, Bookmark, BookmarkCheck, ChevronDown, ChevronRight, RefreshCw, ShoppingBag } from "lucide-react-native";
import { CityPickerSheet } from "@/components/CityPickerSheet";
import { LookContextSheet } from "@/components/LookContextSheet";
import { useWardrobe } from "@/store/wardrobe-store";
import { buildOutfit, countCombinations, outfitPieceIds, outfitPieces } from "@/lib/outfit-engine";
import { defaultFormalityFor, findSavedLookForOutfit, getFormality, getOccasion } from "@/data/types";
import { formatTempRange } from "@/lib/weather";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

function greetingForHour(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const {
    wardrobe,
    weekPlan,
    preferences,
    savedLooks,
    saveLook,
    deleteLook,
    refreshWeather,
    weatherLoading,
    todayLookVariant,
    todayExcludeIds,
    refreshTodayLook,
    setDayOccasion,
    setDayFormality,
    setDayOutfit,
    resolveDayOutfit,
    getTodayPlan,
  } = useWardrobe();
  const [contextOpen, setContextOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const today = getTodayPlan();
  const generated = useMemo(
    () =>
      buildOutfit(wardrobe, today?.occasionId ?? "trabalho", today?.temp, {
        variant: todayLookVariant,
        excludeIds: todayExcludeIds,
        formality: today?.formalityId,
        tempMin: today?.tempMin,
      }),
    [wardrobe, today, todayLookVariant, todayExcludeIds]
  );

  const savedToday = today ? resolveDayOutfit(today) : null;
  const outfit = savedToday ?? generated.outfit ?? null;
  const lookMessage = savedToday
    ? "Look ajustado com peças do seu guarda-roupa."
    : generated.message;

  const pieces = outfit ? outfitPieces(outfit) : [];
  const hero = pieces[0]?.item;
  const savedMatch = useMemo(
    () => (outfit ? findSavedLookForOutfit(savedLooks, outfit) : undefined),
    [outfit, savedLooks]
  );
  const isSaved = Boolean(savedMatch);
  const occasion = today ? getOccasion(today.occasionId) : null;
  const formality = today ? getFormality(today.formalityId) : null;

  useEffect(() => {
    refreshWeather();
  }, []);

  const onToggleSave = async () => {
    if (!outfit) {
      Alert.alert("Look incompleto", lookMessage);
      return;
    }
    if (savedMatch) {
      await deleteLook(savedMatch.id);
      Alert.alert("Removido", "Look removido dos Looks salvos.");
      return;
    }
    await saveLook(outfit, "Look de hoje", today?.occasionId, today?.formalityId);
    Alert.alert("Salvo", "Look adicionado em Looks salvos.");
  };

  const onChangeLook = async () => {
    if (!today) {
      refreshTodayLook(outfit);
      return;
    }
    const nextExclude = outfit ? outfitPieceIds(outfit) : [];
    const nextVariant = todayLookVariant + 1;
    refreshTodayLook(outfit);
    const result = buildOutfit(wardrobe, today.occasionId, today.temp, {
      formality: today.formalityId,
      tempMin: today.tempMin,
      variant: nextVariant,
      excludeIds: nextExclude,
    });
    await setDayOutfit(today.id, result.outfit ?? null);
  };

  const onOccasionChange = async (id: Parameters<typeof setDayOccasion>[1]) => {
    if (!today) return;
    const formalityId = defaultFormalityFor(id);
    const nextVariant = todayLookVariant + 1;
    await setDayOccasion(today.id, id);
    refreshTodayLook(null);
    const result = buildOutfit(wardrobe, id, today.temp, {
      formality: formalityId,
      tempMin: today.tempMin,
      variant: nextVariant,
      excludeIds: [],
    });
    await setDayOutfit(today.id, result.outfit ?? null);
  };

  const onFormalityChange = async (id: Parameters<typeof setDayFormality>[1]) => {
    if (!today) return;
    const nextVariant = todayLookVariant + 1;
    await setDayFormality(today.id, id);
    refreshTodayLook(null);
    const result = buildOutfit(wardrobe, today.occasionId, today.temp, {
      formality: id,
      tempMin: today.tempMin,
      variant: nextVariant,
      excludeIds: [],
    });
    await setDayOutfit(today.id, result.outfit ?? null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{greetingForHour()}</Text>
        <Text style={styles.hero}>{preferences.displayName || "Olá"}</Text>
        <View style={styles.weatherRow}>
          <Pressable onPress={() => refreshWeather()} hitSlop={8}>
            <Text style={styles.weather}>
              {today?.weather ?? "☀️"}{" "}
              {formatTempRange(today?.tempMax ?? today?.temp, today?.tempMin ?? today?.temp)}
              {weatherLoading ? " · atualizando…" : ""}
            </Text>
          </Pressable>
          <Text style={styles.weatherSep}> · </Text>
          <Pressable
            style={styles.cityBtn}
            onPress={() => setCityOpen(true)}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Trocar cidade"
          >
            <Text style={styles.cityText}>{preferences.city || "Escolher cidade"}</Text>
            <ChevronDown size={14} color={colors.ink} />
          </Pressable>
        </View>

        {wardrobe.length === 0 && (
          <Pressable style={styles.startCard} onPress={() => router.push("/(tabs)/add")}>
            <Text style={styles.startEyebrow}>Primeiro passo</Text>
            <Text style={styles.startTitle}>Adicione peças do seu armário</Text>
            <Text style={styles.startBody}>
              Toque em + e fotografe 5–8 peças. A IA preenche os detalhes; você confirma e salva.
            </Text>
            <Text style={styles.startCta}>Começar agora →</Text>
          </Pressable>
        )}

        <Text style={[styles.section, { marginTop: wardrobe.length === 0 ? 24 : 36 }]}>Look de hoje</Text>
        <View style={styles.card}>
          {hero ? (
            <Image source={{ uri: hero.img }} style={styles.heroImg} />
          ) : (
            <View style={[styles.heroImg, styles.heroEmpty]}>
              <Text style={styles.emptyText}>Adicione peças para gerar looks</Text>
            </View>
          )}
          {today && occasion && formality && (
            <Pressable
              style={styles.tag}
              onPress={() => setContextOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Alterar ocasião e formalidade"
            >
              <Text style={styles.tagText}>
                {occasion.emoji} {occasion.label} · {formality.label}
              </Text>
              <ChevronDown size={14} color={colors.ink} />
            </Pressable>
          )}
          <View style={styles.cardBody}>
            <View style={styles.pieceRow}>
              {pieces.slice(0, 4).map(({ label, item }) => (
                <View key={item.id + label} style={styles.piece}>
                  <Image source={{ uri: item.img }} style={styles.pieceImg} />
                  <Text style={styles.pieceLabel}>{label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => {
                  if (!outfit) {
                    Alert.alert("Look incompleto", lookMessage);
                    return;
                  }
                  router.push("/look/today");
                }}
              >
                <Text style={styles.primaryText}>Ver look completo</Text>
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                onPress={() => void onChangeLook()}
                accessibilityLabel="Mudar look"
              >
                <RefreshCw size={15} color={colors.muted} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.saveBtn, isSaved && styles.saveBtnOn, !outfit && { opacity: 0.45 }]}
              onPress={onToggleSave}
              disabled={!outfit}
            >
              {isSaved ? (
                <BookmarkCheck size={14} color={colors.goldDark} />
              ) : (
                <Bookmark size={14} color={colors.ink} />
              )}
              <Text style={[styles.saveText, isSaved && styles.saveTextOn]}>
                {isSaved ? "Remover dos salvos" : "Salvar look"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.weekHeader}>
          <Text style={styles.section}>Esta semana</Text>
          <Pressable style={styles.linkRow} onPress={() => router.push("/planning")}>
            <Text style={styles.link}>Planejar</Text>
            <ChevronRight size={13} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRow}>
          {weekPlan.slice(0, 6).map((d) => {
            const occ = getOccasion(d.occasionId);
            const resolved = resolveDayOutfit(d);
            const preview =
              resolved ??
              buildOutfit(wardrobe, d.occasionId, d.temp, {
                formality: d.formalityId,
                tempMin: d.tempMin,
              }).outfit;
            const thumb = preview ? outfitPieces(preview)[0]?.item.img : undefined;
            const isToday = today?.id === d.id;
            return (
              <Pressable
                key={d.id}
                onPress={() => router.push("/planning")}
                style={[styles.dayCard, isToday && styles.dayActive]}
              >
                <View style={[styles.dayHead, isToday && styles.dayHeadActive]}>
                  <Text style={[styles.dayName, isToday && styles.dayNameActive]}>{d.day}</Text>
                  <Text style={[styles.dayTemp, isToday && styles.dayNameActive]}>
                    {d.tempMax ?? d.temp}°/{d.tempMin ?? d.temp}°
                  </Text>
                </View>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.dayImg} />
                ) : (
                  <View style={[styles.dayImg, { backgroundColor: colors.creamDark }]} />
                )}
                <View style={[styles.dayFoot, isToday && styles.dayHeadActive]}>
                  <Text>{occ.emoji}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.links}>
          <Pressable style={styles.linkCard} onPress={() => router.push("/shopping")}>
            <View style={[styles.iconBox, { backgroundColor: colors.creamWarm }]}>
              <ShoppingBag size={14} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>Sugestões de compra</Text>
              <Text style={styles.linkSub}>Peças para completar seu estilo</Text>
            </View>
            <ChevronRight size={15} color={colors.soft} />
          </Pressable>
          <Pressable style={styles.linkCard} onPress={() => router.push("/stats")}>
            <View style={styles.iconBox}>
              <BarChart2 size={14} color={colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.linkTitle}>
                {wardrobe.length} peças · {countCombinations(wardrobe)} combinações
              </Text>
              <Text style={styles.linkSub}>Ver estatísticas completas</Text>
            </View>
            <ChevronRight size={15} color={colors.soft} />
          </Pressable>
        </View>
      </ScrollView>

      {today && (
        <LookContextSheet
          visible={contextOpen}
          occasionId={today.occasionId}
          formalityId={today.formalityId}
          onOccasionChange={onOccasionChange}
          onFormalityChange={onFormalityChange}
          onClose={() => setContextOpen(false)}
        />
      )}

      <CityPickerSheet
        visible={cityOpen}
        currentCity={preferences.city}
        onClose={() => setCityOpen(false)}
        onSelect={async (c, label) => {
          await refreshWeather({
            city: label,
            latitude: c.latitude,
            longitude: c.longitude,
          });
          Alert.alert("Cidade atualizada", `Clima de ${label} sincronizado.`);
        }}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { paddingHorizontal: 24, paddingBottom: 32 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 8,
  },
  hero: { fontFamily: fonts.display, fontSize: 34, color: colors.ink, marginTop: 4 },
  weather: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  weatherRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    alignSelf: "flex-start",
  },
  weatherSep: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  cityBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  cityText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
    textDecorationLine: "underline",
    textDecorationColor: colors.gold,
  },
  startCard: {
    marginTop: 24,
    backgroundColor: colors.ink,
    borderRadius: 22,
    padding: 20,
  },
  startEyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  startTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.white,
    marginTop: 8,
  },
  startBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.onInk,
    opacity: 0.6,
    marginTop: 8,
    lineHeight: 19,
  },
  startCta: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.gold,
    marginTop: 14,
  },
  section: { fontFamily: fonts.displayMedium, fontSize: 22, color: colors.ink, marginBottom: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: "hidden",
  },
  heroImg: { width: "100%", height: 280, backgroundColor: colors.creamDark },
  heroEmpty: { alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: fonts.body, color: colors.muted },
  tag: {
    position: "absolute",
    top: 16,
    left: 16,
    maxWidth: "78%",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
  },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.ink, flexShrink: 1 },
  cardBody: { padding: 20 },
  pieceRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  piece: { flex: 1, alignItems: "center", gap: 6 },
  pieceImg: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: colors.creamDark,
  },
  pieceLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted },
  actions: { flexDirection: "row", gap: 8 },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.white },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 13,
    backgroundColor: colors.creamWarm,
  },
  saveBtnOn: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  saveText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  saveTextOn: { color: colors.goldDark },
  weekHeader: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  link: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  weekRow: { gap: 10, paddingBottom: 4 },
  dayCard: {
    width: 64,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  dayActive: { borderWidth: 2, borderColor: colors.gold },
  dayHead: { paddingTop: 10, paddingBottom: 6, alignItems: "center", backgroundColor: colors.white },
  dayHeadActive: { backgroundColor: colors.ink },
  dayName: { fontFamily: fonts.mono, fontSize: 9, color: colors.muted, textTransform: "uppercase" },
  dayNameActive: { color: colors.white },
  dayTemp: { fontFamily: fonts.monoMedium, fontSize: 9, color: colors.ink, marginTop: 2 },
  dayImg: { width: 64, height: 72 },
  dayFoot: { paddingVertical: 8, alignItems: "center", backgroundColor: colors.white },
  links: { marginTop: 40, gap: 12 },
  linkCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.creamDark,
    alignItems: "center",
    justifyContent: "center",
  },
  linkTitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  linkSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  });
}
