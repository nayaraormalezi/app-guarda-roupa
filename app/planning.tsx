import React, { useEffect, useMemo, useState } from "react";
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
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Heart,
  MapPin,
  Plus,
  RefreshCw,
  Shuffle,
  Sparkles,
  X,
} from "lucide-react-native";
import { LookContextPicker } from "@/components/LookContextPicker";
import { AddPieceSheet } from "@/components/AddPieceSheet";
import { FavoriteLookSheet } from "@/components/FavoriteLookSheet";
import { SwapPieceSheet } from "@/components/SwapPieceSheet";
import { categoryLabel, STATUS_LABEL } from "@/data/catalog";
import type { ClothingItem, Outfit } from "@/data/types";
import {
  defaultFormalityFor,
  findSavedLookForOutfit,
  getFormality,
  getOccasion,
  type FormalityId,
  type OccasionId,
} from "@/data/types";
import { dayPlanId } from "@/data/seed";
import {
  alternativesForSlot,
  buildOutfit,
  emptyOutfitSlots,
  outfitPieceIds,
  outfitPieces,
  removeOutfitSlot,
  slotLabel,
  swapOutfitSlot,
  type OutfitSlot,
} from "@/lib/outfit-engine";
import { formatTempRange } from "@/lib/weather";
import { useWardrobe } from "@/store/wardrobe-store";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

function pieceSlot(label: string, _item: ClothingItem): OutfitSlot {
  if (label === "Superior") return "top";
  if (label === "Inferior") return "bottom";
  if (label === "Vestido" || label === "Macacão") return "dress";
  if (label === "Casaco") return "outerwear";
  if (label === "Sapato") return "shoe";
  if (label === "Acessório") return "accessory";
  return "bag";
}

export default function PlanningScreen() {
  const router = useRouter();
  const {
    wardrobe,
    weekPlan,
    preferences,
    savedLooks,
    setDayOccasion,
    setDayFormality,
    setDayOutfit,
    markDayUsed,
    resolveDayOutfit,
    refreshWeather,
    saveLook,
    deleteLook,
    resolveLook,
  } = useWardrobe();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [selected, setSelected] = useState(0);
  const [contextSheet, setContextSheet] = useState(false);
  const [favoriteSheet, setFavoriteSheet] = useState(false);
  const [addPieceSheet, setAddPieceSheet] = useState(false);
  const [swapSlot, setSwapSlot] = useState<OutfitSlot | null>(null);
  const [outfitOverride, setOutfitOverride] = useState<Outfit | null>(null);
  const [dayVariants, setDayVariants] = useState<Record<string, number>>({});
  const [dayExclude, setDayExclude] = useState<Record<string, string[]>>({});
  const didSelectToday = React.useRef(false);

  // Default selection to calendar today once the week plan is available
  useEffect(() => {
    if (didSelectToday.current || !weekPlan.length) return;
    const todayKey = dayPlanId(new Date());
    const idx = weekPlan.findIndex(
      (d) => d.id === todayKey || d.id.replace(/^day-/, "") === todayKey.replace(/^day-/, "")
    );
    if (idx >= 0) {
      setSelected(idx);
      didSelectToday.current = true;
    }
  }, [weekPlan]);

  const day = weekPlan[selected] ?? weekPlan[0];
  const occ = day ? getOccasion(day.occasionId) : getOccasion("casa");
  const formality = day ? getFormality(day.formalityId) : getFormality("casual_arrumado");
  const variant = day ? dayVariants[day.id] ?? 0 : 0;
  const excludeIds = day ? dayExclude[day.id] ?? [] : [];

  const generated = useMemo(() => {
    if (!day) return null;
    return buildOutfit(wardrobe, day.occasionId, day.temp, {
      formality: day.formalityId,
      tempMin: day.tempMin,
      variant,
      excludeIds,
    });
  }, [wardrobe, day, variant, excludeIds]);

  useEffect(() => {
    if (!day) {
      setOutfitOverride(null);
      return;
    }
    setOutfitOverride(resolveDayOutfit(day));
    setSwapSlot(null);
  }, [day?.id, day?.outfitRefs, resolveDayOutfit]);

  const outfit = outfitOverride ?? generated?.outfit ?? null;
  const message = outfitOverride
    ? "Look ajustado com peças do seu guarda-roupa."
    : generated?.message ?? "";
  const pieces = outfit ? outfitPieces(outfit) : [];
  const canAddPiece = emptyOutfitSlots(outfit).length > 0;
  const hero = pieces[0]?.item;
  const usedCount = weekPlan.filter((d) => d.used).length;
  const plannedCount = weekPlan.filter((d) => d.outfitRefs).length;
  const savedMatch = useMemo(
    () => (outfit ? findSavedLookForOutfit(savedLooks, outfit) : undefined),
    [outfit, savedLooks]
  );
  const isSaved = Boolean(savedMatch);

  const alternatives = useMemo(() => {
    if (!swapSlot || !day || !outfit) return [];
    const current = outfit[swapSlot];
    return alternativesForSlot(
      wardrobe,
      swapSlot,
      day.occasionId,
      day.formalityId,
      day.temp,
      current?.id,
      outfit
    );
  }, [swapSlot, wardrobe, day, outfit]);

  if (!day) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Sem plano carregado</Text>
      </View>
    );
  }

  const persistOutfit = async (next: Outfit | null) => {
    setOutfitOverride(next);
    await setDayOutfit(day.id, next);
  };

  const buildAndPersist = async (opts: {
    occasionId: OccasionId;
    formalityId: FormalityId;
    variant: number;
    excludeIds: string[];
  }) => {
    const result = buildOutfit(wardrobe, opts.occasionId, day.temp, {
      formality: opts.formalityId,
      tempMin: day.tempMin,
      variant: opts.variant,
      excludeIds: opts.excludeIds,
    });
    await persistOutfit(result.outfit ?? null);
  };

  const onClearLook = async () => {
    await persistOutfit(null);
  };

  const onChangeLook = async () => {
    const nextExclude = outfit ? outfitPieceIds(outfit) : [];
    const nextVariant = (dayVariants[day.id] ?? 0) + 1;
    setDayExclude((prev) => ({ ...prev, [day.id]: nextExclude }));
    setDayVariants((prev) => ({ ...prev, [day.id]: nextVariant }));
    await buildAndPersist({
      occasionId: day.occasionId,
      formalityId: day.formalityId,
      variant: nextVariant,
      excludeIds: nextExclude,
    });
  };

  const onToggleUsed = async () => {
    if (!outfit) {
      Alert.alert("Look incompleto", "Monte um look antes de marcar como usado.");
      return;
    }
    if (!day.outfitRefs) await setDayOutfit(day.id, outfit);
    await markDayUsed(day.id, !day.used);
  };

  const onToggleFavorite = async () => {
    if (!outfit) {
      Alert.alert("Look incompleto", message);
      return;
    }
    if (savedMatch) {
      await deleteLook(savedMatch.id);
      Alert.alert("Removido", "Look removido dos Looks salvos.");
      return;
    }
    await saveLook(outfit, `Look ${day.day}`, day.occasionId, day.formalityId);
    Alert.alert("Salvo", "Look adicionado em Looks salvos.");
  };

  const onPickSwap = async (item: ClothingItem) => {
    if (!outfit || !swapSlot) return;
    const next = swapOutfitSlot(outfit, swapSlot, item);
    await persistOutfit(next);
    setSwapSlot(null);
  };

  const onPickFavorite = async (_look: (typeof savedLooks)[number], next: Outfit) => {
    await persistOutfit(next);
    setFavoriteSheet(false);
  };

  const onAddPiece = async (slot: OutfitSlot, item: ClothingItem) => {
    const next = swapOutfitSlot(outfit ?? {}, slot, item);
    await persistOutfit(next);
    setAddPieceSheet(false);
  };

  const onRemovePiece = async (slot: OutfitSlot) => {
    if (!outfit) return;
    const next = removeOutfitSlot(outfit, slot);
    const remaining = outfitPieces(next);
    await persistOutfit(remaining.length ? next : null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
              buildOutfit(wardrobe, d.occasionId, d.temp, {
                formality: d.formalityId,
                tempMin: d.tempMin,
                variant: dayVariants[d.id] ?? 0,
                excludeIds: dayExclude[d.id] ?? [],
              }).outfit;
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
                    setContextSheet(true);
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
              <Pressable style={styles.occChip} onPress={() => setContextSheet(true)}>
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
                  {day.outfitRefs || outfitOverride ? "Look ajustado" : "Sugestão"} ·{" "}
                  {formality.label.toLowerCase()} para {occ.label}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.miss}>{message || "Adicione peças ao closet."}</Text>
          )}

          <Text style={styles.section}>Peças do look</Text>
          {pieces.length === 0 ? (
            <View style={styles.piecesBlock}>
              <Text style={styles.missInline}>Nenhuma peça neste look ainda.</Text>
              <Pressable style={styles.addPieceBtn} onPress={() => setAddPieceSheet(true)}>
                <Plus size={14} color={colors.ink} />
                <Text style={styles.addPieceText}>Adicionar peça</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.piecesBlock}>
              {pieces.map(({ label, item }) => (
                <View key={`${label}-${item.id}`} style={styles.pieceRow}>
                  <Pressable
                    style={styles.pieceMain}
                    onPress={() => router.push(`/piece/${item.id}`)}
                  >
                    <Image source={{ uri: item.img }} style={styles.thumb} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pieceRole}>{label}</Text>
                      <Text style={styles.pieceName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.pieceSub} numberOfLines={1}>
                        {item.brand} · {item.color} · {categoryLabel(item.category)}
                      </Text>
                      <Text style={styles.pieceStatus}>{STATUS_LABEL[item.status]}</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={styles.swapBtn}
                    onPress={() => setSwapSlot(pieceSlot(label, item))}
                    accessibilityLabel={`Trocar ${label}`}
                  >
                    <Shuffle size={14} color={colors.ink} />
                  </Pressable>
                  <Pressable
                    style={styles.swapBtn}
                    onPress={() => void onRemovePiece(pieceSlot(label, item))}
                    accessibilityLabel={`Remover ${label}`}
                  >
                    <X size={14} color={colors.ink} />
                  </Pressable>
                </View>
              ))}
              {canAddPiece ? (
                <Pressable style={styles.addPieceBtn} onPress={() => setAddPieceSheet(true)}>
                  <Plus size={14} color={colors.ink} />
                  <Text style={styles.addPieceText}>Adicionar peça</Text>
                </Pressable>
              ) : null}
            </View>
          )}

          <View style={styles.actions}>
            <View style={styles.rowActions}>
              <Pressable
                style={[styles.secondary, day.used && styles.secondaryOn, !outfit && styles.disabled]}
                onPress={onToggleUsed}
                disabled={!outfit}
              >
                <Check size={14} color={day.used ? colors.goldDark : colors.ink} />
                <Text style={[styles.secondaryText, day.used && { color: colors.goldDark }]}>
                  {day.used ? "Usado" : "Marcar usei"}
                </Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => void onChangeLook()}>
                <RefreshCw size={14} color={colors.ink} />
                <Text style={styles.secondaryText}>Mudar look</Text>
              </Pressable>
            </View>

            <Pressable style={[styles.secondary, { width: "100%" }]} onPress={() => setFavoriteSheet(true)}>
              <Heart size={14} color={colors.ink} />
              <Text style={styles.secondaryText}>Dos favoritos</Text>
            </Pressable>

            <Pressable
              style={[
                styles.secondary,
                isSaved && styles.secondaryOn,
                !outfit && styles.disabled,
                { width: "100%" },
              ]}
              onPress={onToggleFavorite}
              disabled={!outfit}
            >
              {isSaved ? (
                <BookmarkCheck size={14} color={colors.goldDark} />
              ) : (
                <Bookmark size={14} color={colors.ink} />
              )}
              <Text style={[styles.secondaryText, isSaved && { color: colors.goldDark }]}>
                {isSaved ? "Remover dos salvos" : "Salvar nos looks"}
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

      <Modal
        visible={contextSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setContextSheet(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setContextSheet(false)} />
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
              const occasionId = id as OccasionId;
              const formalityId = defaultFormalityFor(occasionId);
              const nextVariant = (dayVariants[day.id] ?? 0) + 1;
              await setDayOccasion(day.id, occasionId);
              setDayExclude((prev) => ({ ...prev, [day.id]: [] }));
              setDayVariants((prev) => ({ ...prev, [day.id]: nextVariant }));
              await buildAndPersist({
                occasionId,
                formalityId,
                variant: nextVariant,
                excludeIds: [],
              });
            }}
            onFormalityChange={async (id) => {
              const formalityId = id as FormalityId;
              const nextVariant = (dayVariants[day.id] ?? 0) + 1;
              await setDayFormality(day.id, formalityId);
              setDayExclude((prev) => ({ ...prev, [day.id]: [] }));
              setDayVariants((prev) => ({ ...prev, [day.id]: nextVariant }));
              await buildAndPersist({
                occasionId: day.occasionId,
                formalityId,
                variant: nextVariant,
                excludeIds: [],
              });
            }}
          />
          <Pressable style={styles.sheetDone} onPress={() => setContextSheet(false)}>
            <Text style={styles.sheetDoneText}>Pronto</Text>
          </Pressable>
        </View>
      </Modal>

      <SwapPieceSheet
        visible={Boolean(swapSlot)}
        title={swapSlot ? `Trocar ${slotLabel(swapSlot).toLowerCase()}` : "Trocar peça"}
        alternatives={alternatives}
        onClose={() => setSwapSlot(null)}
        onSelect={onPickSwap}
      />

      <FavoriteLookSheet
        visible={favoriteSheet}
        looks={savedLooks}
        resolveLook={resolveLook}
        onClose={() => setFavoriteSheet(false)}
        onSelect={onPickFavorite}
      />

      <AddPieceSheet
        visible={addPieceSheet}
        wardrobe={wardrobe}
        outfit={outfit}
        occasionId={day.occasionId}
        formalityId={day.formalityId}
        temp={day.temp}
        onClose={() => setAddPieceSheet(false)}
        onSelect={onAddPiece}
      />
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
  cardHead: { padding: 20, paddingBottom: 12 },
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
  heroWrap: { marginHorizontal: 20, marginBottom: 16 },
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
  missInline: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
  },
  section: {
    fontFamily: fonts.displayMedium,
    fontSize: 16,
    color: colors.ink,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  piecesBlock: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  pieceRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 10,
    alignItems: "center",
  },
  pieceMain: { flexDirection: "row", gap: 12, flex: 1, alignItems: "center" },
  thumb: {
    width: 64,
    height: 78,
    borderRadius: 12,
    backgroundColor: colors.creamDark,
  },
  pieceRole: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pieceName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink, marginTop: 2 },
  pieceSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  pieceStatus: { fontFamily: fonts.mono, fontSize: 10, color: colors.goldDark, marginTop: 4 },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  addPieceBtn: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: colors.cream,
  },
  addPieceText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  actions: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  primary: {
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.white },
  rowActions: { flexDirection: "row", gap: 10 },
  secondary: {
    flex: 1,
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
  secondaryText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  clear: {
    textAlign: "center",
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
  },
  disabled: { opacity: 0.45 },
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
  backdrop: { flex: 1, backgroundColor: colors.overlay },
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
}
