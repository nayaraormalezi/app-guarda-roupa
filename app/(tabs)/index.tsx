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
import {
  BarChart2,
  Bookmark,
  BookmarkCheck,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ShoppingBag,
} from "lucide-react-native";
import { CityPickerSheet } from "@/components/CityPickerSheet";
import { LookContextSheet } from "@/components/LookContextSheet";
import { useWardrobe } from "@/store/wardrobe-store";
import { buildOutfit, countCombinations, outfitPieceIds, outfitPieces } from "@/lib/outfit-engine";
import { defaultFormalityFor, findSavedLookForOutfit, getFormality, getOccasion } from "@/data/types";
import { weatherLabelFromEmoji } from "@/lib/weather";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { radius } from "@/theme/colors";
import { fonts } from "@/theme/typography";

function greetingForHour(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Bom dia";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

function dayNumber(dateStr?: string): string {
  if (!dateStr) return "";
  const part = dateStr.includes("-") ? dateStr.split("-").pop() : dateStr.split("/").pop();
  return part?.replace(/\D/g, "") || dateStr;
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
  const tempNow = today?.tempMax ?? today?.temp;
  const weatherLabel = weatherLabelFromEmoji(today?.weather);

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

        <Pressable style={styles.weatherCard} onPress={() => setCityOpen(true)}>
          <View style={styles.weatherMain}>
            <Text style={styles.weatherEmoji}>{today?.weather ?? "☀️"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.weatherTempLine}>
                <Text style={styles.weatherTemp}>{tempNow != null ? `${tempNow}°` : "—"}</Text>
                {"  "}
                <Text style={styles.weatherCond}>{weatherLabel}</Text>
                {weatherLoading ? " · …" : ""}
              </Text>
              <Text style={styles.weatherMeta} numberOfLines={1}>
                {preferences.city || "Escolher cidade"}
                {today ? ` · ${today.tempMax}° / ${today.tempMin}°` : ""}
              </Text>
            </View>
            <ChevronDown size={16} color={colors.muted} strokeWidth={1.75} />
          </View>
        </Pressable>

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

        <View style={[styles.sectionRow, { marginTop: 40 }]}>
          <Text style={styles.sectionWeek}>Planejamento da semana</Text>
          <Pressable style={styles.sectionLink} onPress={() => router.push("/planning")} hitSlop={8}>
            <Text style={styles.sectionLinkText}>Ver tudo</Text>
            <ChevronRight size={14} color={colors.muted} strokeWidth={1.75} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekRow}>
          {weekPlan.slice(0, 7).map((d) => {
            const resolved = resolveDayOutfit(d);
            const preview =
              resolved ??
              buildOutfit(wardrobe, d.occasionId, d.temp, {
                formality: d.formalityId,
                tempMin: d.tempMin,
              }).outfit;
            const thumbs = preview ? outfitPieces(preview).slice(0, 2) : [];
            const isToday = today?.id === d.id;
            const num = dayNumber(d.date);
            return (
              <Pressable
                key={d.id}
                onPress={() => router.push("/planning")}
                style={[styles.dayCard, isToday && styles.dayActive]}
              >
                <Text style={[styles.dayName, isToday && styles.dayNameActive]}>{d.day}</Text>
                <Text style={[styles.dayNum, isToday && styles.dayNumActive]}>{num || "—"}</Text>
                <Text style={styles.dayWeather}>
                  {d.weather} {d.tempMax ?? d.temp}°
                </Text>
                <View style={styles.dayThumbs}>
                  {thumbs.length > 0 ? (
                    thumbs.map(({ item }) => (
                      <Image key={item.id} source={{ uri: item.img }} style={styles.dayThumb} />
                    ))
                  ) : (
                    <View style={[styles.dayThumb, { backgroundColor: colors.creamDark }]} />
                  )}
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
    weatherCard: {
      marginTop: 16,
      backgroundColor: colors.white,
      borderRadius: radius.card,
      paddingVertical: 18,
      paddingHorizontal: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    weatherMain: { flexDirection: "row", alignItems: "center", gap: 14 },
    weatherEmoji: { fontSize: 28 },
    weatherTempLine: { marginBottom: 4 },
    weatherTemp: {
      fontFamily: fonts.bodySemi,
      fontSize: 22,
      color: colors.ink,
    },
    weatherCond: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.ink,
    },
    weatherMeta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.muted,
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
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    sectionWeek: {
      fontFamily: fonts.display,
      fontSize: 24,
      color: colors.ink,
    },
    sectionLink: { flexDirection: "row", alignItems: "center", gap: 2 },
    sectionLinkText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.muted,
    },
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
    weekRow: { gap: 10, paddingBottom: 4 },
    dayCard: {
      width: 88,
      borderRadius: radius.card,
      backgroundColor: colors.white,
      paddingTop: 14,
      paddingBottom: 12,
      paddingHorizontal: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    dayActive: {
      backgroundColor: colors.creamWarm,
      borderColor: colors.gold,
    },
    dayName: {
      fontFamily: fonts.bodyMedium,
      fontSize: 11,
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    dayNameActive: { color: colors.ink },
    dayNum: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: colors.ink,
      marginTop: 2,
      lineHeight: 34,
    },
    dayNumActive: { color: colors.ink },
    dayWeather: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.muted,
      marginTop: 4,
    },
    dayThumbs: {
      marginTop: 12,
      flexDirection: "row",
      gap: 4,
    },
    dayThumb: {
      flex: 1,
      height: 44,
      borderRadius: 10,
      backgroundColor: colors.creamDark,
    },
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
