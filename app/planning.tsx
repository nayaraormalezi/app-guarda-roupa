import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, MapPin, Sparkles } from "lucide-react-native";
import { LookContextPicker } from "@/components/LookContextPicker";
import { getFormality, getOccasion, type FormalityId, type OccasionId } from "@/data/types";
import { buildOutfit, outfitPieces } from "@/lib/outfit-engine";
import { formatTempRange } from "@/lib/weather";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function PlanningScreen() {
  const {
    wardrobe,
    weekPlan,
    preferences,
    setDayOccasion,
    setDayFormality,
    setDayOutfit,
    markDayUsed,
    resolveDayOutfit,
    refreshWeather,
  } = useWardrobe();
  const [selected, setSelected] = useState(0);
  const [sheet, setSheet] = useState(false);
  const day = weekPlan[selected] ?? weekPlan[0];
  const occ = day ? getOccasion(day.occasionId) : getOccasion("casa");
  const formality = day ? getFormality(day.formalityId) : getFormality("casual_arrumado");

  const generated = useMemo(() => {
    if (!day) return null;
    return buildOutfit(wardrobe, day.occasionId, day.temp, { formality: day.formalityId });
  }, [wardrobe, day]);

  const savedOutfit = day ? resolveDayOutfit(day) : null;
  const outfit = savedOutfit ?? generated?.outfit ?? null;
  const pieces = outfit ? outfitPieces(outfit) : [];
  const hero = pieces[0]?.item;
  const usedCount = weekPlan.filter((d) => d.used).length;
  const plannedCount = weekPlan.filter((d) => d.outfitRefs).length;

  if (!day) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sem plano carregado</Text>
      </View>
    );
  }

  const onSaveLook = async () => {
    const next = generated?.outfit;
    if (!next) {
      Alert.alert("Look incompleto", generated?.message ?? "Adicione peças ao closet.");
      return;
    }
    await setDayOutfit(day.id, next);
    Alert.alert("Look planejado", `Salvo para ${day.day}, ${day.date}.`);
  };

  const onClearLook = async () => {
    await setDayOutfit(day.id, null);
  };

  const onToggleUsed = async () => {
    if (!day.outfitRefs && !outfit) {
      Alert.alert("Salve o look", "Salve o look do dia antes de marcar como usado.");
      return;
    }
    if (!day.outfitRefs && outfit) await setDayOutfit(day.id, outfit);
    await markDayUsed(day.id, !day.used);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cityRow}>
          <MapPin size={10} color={colors.muted} />
          <Pressable onPress={() => refreshWeather()}>
            <Text style={styles.city}>
              {preferences.city || "Sua cidade"} · {plannedCount} planejados · {usedCount} usados
            </Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.week}
        >
          {weekPlan.map((d, i) => {
            const o = getOccasion(d.occasionId);
            const resolved = resolveDayOutfit(d);
            const preview =
              resolved ??
              buildOutfit(wardrobe, d.occasionId, d.temp, { formality: d.formalityId }).outfit;
            const thumb = preview ? outfitPieces(preview)[0]?.item.img : undefined;
            const on = i === selected;
            return (
              <Pressable
                key={d.id}
                onPress={() => setSelected(i)}
                style={[styles.day, on && styles.dayOn]}
              >
                <View style={[styles.dayHead, on && styles.dayHeadOn]}>
                  <Text style={[styles.dayName, on && styles.onText]}>{d.day}</Text>
                  <Text style={[styles.dayTemp, on && styles.onText]}>
                    {d.tempMax ?? d.temp}°/{d.tempMin ?? d.temp}°
                  </Text>
                </View>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.dayImg} />
                ) : (
                  <View style={styles.dayImg} />
                )}
                <Pressable
                  style={[styles.dayFoot, on && { backgroundColor: "rgba(196,169,125,0.15)" }]}
                  onPress={() => {
                    setSelected(i);
                    setSheet(true);
                  }}
                >
                  <Text>{d.used ? "✓" : o.emoji}</Text>
                </Pressable>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View>
              <Text style={styles.cardTitle}>
                {day.day}, {day.date}
              </Text>
              <Pressable style={styles.occChip} onPress={() => setSheet(true)}>
                <Text>
                  {occ.emoji} {occ.label} · {formality.label}
                </Text>
                <Text style={styles.temp}>
                  {day.weather}{" "}
                  {formatTempRange(day.tempMax ?? day.temp, day.tempMin ?? day.temp)}
                </Text>
              </Pressable>
            </View>
          </View>
          {hero ? (
            <View style={styles.heroWrap}>
              <Image source={{ uri: hero.img }} style={styles.hero} />
              <View style={styles.heroCap}>
                <Sparkles size={11} color={colors.gold} />
                <Text style={styles.heroCapText}>
                  {day.outfitRefs ? "Look salvo" : "Sugestão"} · {formality.label.toLowerCase()}{" "}
                  para {occ.label}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.miss}>{generated?.message}</Text>
          )}
          {pieces.length > 0 && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 6 }}>
              {pieces.map(({ label, item }) => (
                <Text key={`${label}-${item.id}`} style={styles.pieceMeta}>
                  {label}: {item.name}
                </Text>
              ))}
            </View>
          )}
          <View style={styles.actions}>
            <Pressable style={styles.primary} onPress={onSaveLook}>
              <Text style={styles.primaryText}>
                {day.outfitRefs ? "Atualizar look salvo" : "Salvar look do dia"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.secondary, day.used && styles.secondaryOn]}
              onPress={onToggleUsed}
            >
              <Check size={14} color={day.used ? colors.goldDark : colors.ink} />
              <Text style={[styles.secondaryText, day.used && { color: colors.goldDark }]}>
                {day.used ? "Usado" : "Marcar usei"}
              </Text>
            </Pressable>
            {day.outfitRefs ? (
              <Pressable onPress={onClearLook}>
                <Text style={styles.clear}>Limpar look salvo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.reuse}>
          <Text style={styles.reuseTitle}>Histórico da semana</Text>
          {weekPlan.map((d) => (
            <View key={d.id} style={styles.histRow}>
              <Text style={styles.histDay}>
                {d.day} {d.date}
              </Text>
              <Text style={styles.histMeta}>
                {d.outfitRefs ? "look salvo" : "sugestão"}
                {d.used ? " · usado" : ""}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={sheet} animationType="slide" transparent onRequestClose={() => setSheet(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSheet(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>
            {day.day}, {day.date}
          </Text>
          <Text style={styles.sheetSub}>Escolha a ocasião e a formalidade</Text>
          <LookContextPicker
            occasionId={day.occasionId}
            formalityId={day.formalityId}
            onOccasionChange={async (id) => {
              await setDayOccasion(day.id, id as OccasionId);
            }}
            onFormalityChange={async (id) => {
              await setDayFormality(day.id, id as FormalityId);
            }}
          />
          <Pressable style={styles.sheetDone} onPress={() => setSheet(false)}>
            <Text style={styles.sheetDoneText}>Pronto</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, paddingBottom: 40 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { fontFamily: fonts.body, color: colors.muted },
  cityRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  city: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  week: { gap: 8, marginBottom: 20 },
  day: {
    width: 58,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.white,
    opacity: 0.75,
  },
  dayOn: { opacity: 1, borderWidth: 2, borderColor: colors.gold },
  dayHead: { paddingTop: 10, paddingBottom: 6, alignItems: "center" },
  dayHeadOn: { backgroundColor: colors.ink },
  dayName: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.muted,
    textTransform: "uppercase",
  },
  dayTemp: { fontFamily: fonts.monoMedium, fontSize: 8, color: colors.ink, marginTop: 2 },
  onText: { color: colors.white },
  dayImg: { width: 58, height: 68, backgroundColor: colors.creamDark },
  dayFoot: { paddingVertical: 8, alignItems: "center" },
  card: { backgroundColor: colors.white, borderRadius: 24, overflow: "hidden", marginBottom: 16 },
  cardHead: { padding: 20 },
  cardTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  occChip: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    backgroundColor: colors.creamWarm,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  temp: { fontFamily: fonts.mono, fontSize: 12, color: colors.gold },
  heroWrap: { marginHorizontal: 20, marginBottom: 12 },
  hero: { width: "100%", height: 220, borderRadius: 18 },
  heroCap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  heroCapText: { fontFamily: fonts.body, fontSize: 11, color: colors.white, flex: 1 },
  miss: { padding: 20, fontFamily: fonts.body, color: colors.muted },
  pieceMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  actions: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  primary: {
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.white },
  secondary: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingVertical: 12,
  },
  secondaryOn: { borderColor: colors.gold, backgroundColor: colors.creamWarm },
  secondaryText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  clear: {
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  reuse: { backgroundColor: colors.white, borderRadius: 20, padding: 20 },
  reuseTitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink, marginBottom: 12 },
  histRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  histDay: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  histMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.creamDark,
    marginBottom: 12,
  },
  sheetTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
  sheetSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginBottom: 16 },
  sheetDone: {
    marginTop: 20,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  sheetDoneText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
});
