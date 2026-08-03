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
import { buildOutfit, countCombinations, outfitPieces } from "@/lib/outfit-engine";
import { findSavedLookForOutfit, getFormality, getOccasion } from "@/data/types";
import { formatTempRange } from "@/lib/weather";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function HomeScreen() {
  const router = useRouter();
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
  } = useWardrobe();
  const [contextOpen, setContextOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const today = weekPlan[0];
  const look = useMemo(
    () =>
      buildOutfit(wardrobe, today?.occasionId ?? "trabalho", today?.temp, {
        variant: todayLookVariant,
        excludeIds: todayExcludeIds,
        formality: today?.formalityId,
      }),
    [wardrobe, today, todayLookVariant, todayExcludeIds]
  );

  const pieces = look.outfit ? outfitPieces(look.outfit) : [];
  const hero = pieces[0]?.item;
  const savedMatch = useMemo(
    () => (look.outfit ? findSavedLookForOutfit(savedLooks, look.outfit) : undefined),
    [look.outfit, savedLooks]
  );
  const isSaved = Boolean(savedMatch);
  const occasion = today ? getOccasion(today.occasionId) : null;
  const formality = today ? getFormality(today.formalityId) : null;

  useEffect(() => {
    refreshWeather();
  }, []);

  const onToggleSave = async () => {
    if (!look.outfit) {
      Alert.alert("Look incompleto", look.message);
      return;
    }
    if (savedMatch) {
      await deleteLook(savedMatch.id);
      Alert.alert("Removido", "Look removido dos Looks salvos.");
      return;
    }
    await saveLook(look.outfit, "Look de hoje", today?.occasionId, today?.formalityId);
    Alert.alert("Salvo", "Look adicionado em Looks salvos.");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Bom dia</Text>
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

        <Text style={[styles.section, { marginTop: 36 }]}>Look de hoje</Text>
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
                  if (!look.outfit) {
                    Alert.alert("Look incompleto", look.message);
                    return;
                  }
                  router.push("/look/today");
                }}
              >
                <Text style={styles.primaryText}>Ver look completo</Text>
              </Pressable>
              <Pressable
                style={styles.iconBtn}
                onPress={() => refreshTodayLook(look.outfit)}
                accessibilityLabel="Mudar look"
              >
                <RefreshCw size={15} color={colors.muted} />
              </Pressable>
            </View>

            <Pressable
              style={[styles.saveBtn, isSaved && styles.saveBtnOn, !look.outfit && { opacity: 0.45 }]}
              onPress={onToggleSave}
              disabled={!look.outfit}
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
          {weekPlan.slice(0, 6).map((d, i) => {
            const occ = getOccasion(d.occasionId);
            const preview = buildOutfit(wardrobe, d.occasionId, d.temp, {
              formality: d.formalityId,
            });
            const thumb = preview.outfit ? outfitPieces(preview.outfit)[0]?.item.img : undefined;
            const isToday = i === 0;
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
          onOccasionChange={(id) => setDayOccasion(today.id, id)}
          onFormalityChange={(id) => setDayFormality(today.id, id)}
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

const styles = StyleSheet.create({
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
