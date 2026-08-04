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
import { Bookmark, BookmarkCheck, Heart, Plus, RefreshCw, Shuffle, X } from "lucide-react-native";
import { LookContextPicker } from "@/components/LookContextPicker";
import { AddPieceSheet } from "@/components/AddPieceSheet";
import { FavoriteLookSheet } from "@/components/FavoriteLookSheet";
import { SwapPieceSheet } from "@/components/SwapPieceSheet";
import { categoryLabel, STATUS_LABEL } from "@/data/catalog";
import type { ClothingItem, Outfit } from "@/data/types";
import { defaultFormalityFor, findSavedLookForOutfit, getFormality, getOccasion } from "@/data/types";
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

function pieceSlot(label: string, item: ClothingItem): OutfitSlot {
  if (label === "Superior") return "top";
  if (label === "Inferior") return "bottom";
  if (label === "Vestido" || label === "Macacão") return "dress";
  if (label === "Casaco") return "outerwear";
  if (label === "Sapato") return "shoe";
  if (label === "Acessório") return "accessory";
  return "bag";
}

export default function TodayLookScreen() {
  const router = useRouter();
  const {
    wardrobe,
    preferences,
    savedLooks,
    todayLookVariant,
    todayExcludeIds,
    refreshTodayLook,
    saveLook,
    deleteLook,
    setDayOccasion,
    setDayFormality,
    setDayOutfit,
    markDayUsed,
    resolveDayOutfit,
    getTodayPlan,
    resolveLook,
  } = useWardrobe();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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

  const [outfitOverride, setOutfitOverride] = useState<Outfit | null>(null);
  const [swapSlot, setSwapSlot] = useState<OutfitSlot | null>(null);
  const [favoriteSheet, setFavoriteSheet] = useState(false);
  const [addPieceSheet, setAddPieceSheet] = useState(false);

  useEffect(() => {
    const saved = today ? resolveDayOutfit(today) : null;
    setOutfitOverride(saved);
  }, [today?.id, today?.outfitRefs, resolveDayOutfit]);

  const outfit = outfitOverride ?? generated.outfit;
  const message = outfitOverride
    ? "Look ajustado com peças do seu guarda-roupa."
    : generated.message;
  const pieces = outfit ? outfitPieces(outfit) : [];
  const canAddPiece = emptyOutfitSlots(outfit).length > 0;
  const occ = today ? getOccasion(today.occasionId) : null;
  const formality = today ? getFormality(today.formalityId) : null;
  const hero = pieces[0]?.item;
  const savedMatch = useMemo(
    () => (outfit ? findSavedLookForOutfit(savedLooks, outfit) : undefined),
    [outfit, savedLooks]
  );
  const isSaved = Boolean(savedMatch);

  const alternatives = useMemo(() => {
    if (!swapSlot || !today || !outfit) return [];
    const current = outfit[swapSlot];
    return alternativesForSlot(
      wardrobe,
      swapSlot,
      today.occasionId,
      today.formalityId,
      today.temp,
      current?.id,
      outfit
    );
  }, [swapSlot, wardrobe, today, outfit]);

  const persistOutfit = async (next: Outfit | null) => {
    setOutfitOverride(next);
    if (today?.id) await setDayOutfit(today.id, next);
  };

  const buildAndPersist = async (opts: {
    occasionId: NonNullable<typeof today>["occasionId"];
    formalityId: NonNullable<typeof today>["formalityId"];
    variant: number;
    excludeIds: string[];
  }) => {
    if (!today) return;
    const result = buildOutfit(wardrobe, opts.occasionId, today.temp, {
      formality: opts.formalityId,
      tempMin: today.tempMin,
      variant: opts.variant,
      excludeIds: opts.excludeIds,
    });
    await persistOutfit(result.outfit ?? null);
  };

  const onToggleSave = async () => {
    if (!outfit) {
      Alert.alert("Look incompleto", message);
      return;
    }
    await persistOutfit(outfit);
    if (savedMatch) {
      await deleteLook(savedMatch.id);
      Alert.alert("Removido", "Look removido dos Looks salvos.");
      return;
    }
    await saveLook(outfit, "Look de hoje", today?.occasionId, today?.formalityId);
    Alert.alert("Salvo", "Look adicionado em Looks salvos.", [
      { text: "Ok" },
      { text: "Ver salvos", onPress: () => router.push("/looks") },
    ]);
  };

  const onChangeLook = async () => {
    if (!today) {
      refreshTodayLook(outfit);
      return;
    }
    const nextExclude = outfit ? outfitPieceIds(outfit) : [];
    const nextVariant = todayLookVariant + 1;
    refreshTodayLook(outfit);
    await buildAndPersist({
      occasionId: today.occasionId,
      formalityId: today.formalityId,
      variant: nextVariant,
      excludeIds: nextExclude,
    });
  };

  const onUseToday = async () => {
    if (!pieces.length || !today || !outfit) return;
    await persistOutfit(outfit);
    await markDayUsed(today.id, true);
    Alert.alert("Look do dia", "Marcado como usado, salvo no planejamento e peças registradas.");
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
        <Text style={styles.eyebrow}>Sugestão do stylist</Text>
        <Text style={styles.title}>Look de hoje</Text>
        <Text style={styles.meta}>
          {occ ? `${occ.emoji} ${occ.label}` : "Ocasião livre"}
          {formality ? ` · ${formality.label}` : ""}
          {" · "}
          {formatTempRange(today?.tempMax ?? today?.temp, today?.tempMin ?? today?.temp)}
          {preferences.city ? ` · ${preferences.city}` : ""}
          {today?.used ? " · usado" : ""}
        </Text>

        {today && (
          <View style={styles.pickerCard}>
            <LookContextPicker
              occasionId={today.occasionId}
              formalityId={today.formalityId}
              onOccasionChange={async (id) => {
                const formalityId = defaultFormalityFor(id);
                const nextVariant = todayLookVariant + 1;
                await setDayOccasion(today.id, id);
                refreshTodayLook(null);
                await buildAndPersist({
                  occasionId: id,
                  formalityId,
                  variant: nextVariant,
                  excludeIds: [],
                });
              }}
              onFormalityChange={async (id) => {
                const nextVariant = todayLookVariant + 1;
                await setDayFormality(today.id, id);
                refreshTodayLook(null);
                await buildAndPersist({
                  occasionId: today.occasionId,
                  formalityId: id,
                  variant: nextVariant,
                  excludeIds: [],
                });
              }}
            />
          </View>
        )}

        {hero ? (
          <Image source={{ uri: hero.img }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroEmpty]}>
            <Text style={styles.empty}>Não foi possível montar um look completo.</Text>
          </View>
        )}

        <Text style={styles.message}>{message}</Text>

        <Text style={styles.section}>Peças do look</Text>
        {pieces.length === 0 ? (
          <View>
            <Text style={styles.empty}>Adicione peças no guarda-roupa para gerar sugestões.</Text>
            <Pressable style={styles.addPieceBtn} onPress={() => setAddPieceSheet(true)}>
              <Plus size={14} color={colors.ink} />
              <Text style={styles.addPieceText}>Adicionar peça</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            {pieces.map(({ label, item }) => (
              <View key={`${label}-${item.id}`} style={styles.pieceRow}>
                <Pressable
                  style={{ flexDirection: "row", gap: 14, flex: 1, alignItems: "center" }}
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

        <Pressable
          style={[styles.primary, !pieces.length && styles.disabled]}
          onPress={onUseToday}
          disabled={!pieces.length}
        >
          <Text style={styles.primaryText}>{today?.used ? "Usado hoje" : "Usar hoje"}</Text>
        </Pressable>

        <View style={styles.rowActions}>
          <Pressable
            style={[
              styles.secondary,
              isSaved && styles.secondarySaved,
              !outfit && styles.disabled,
            ]}
            onPress={onToggleSave}
            disabled={!outfit}
          >
            {isSaved ? (
              <BookmarkCheck size={15} color={colors.goldDark} />
            ) : (
              <Bookmark size={15} color={colors.ink} />
            )}
            <Text style={[styles.secondaryText, isSaved && styles.secondaryTextSaved]}>
              {isSaved ? "Remover dos salvos" : "Salvar look"}
            </Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={onChangeLook}>
            <RefreshCw size={15} color={colors.ink} />
            <Text style={styles.secondaryText}>Mudar look</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.secondary, { width: "100%", marginTop: 10 }]} onPress={() => setFavoriteSheet(true)}>
          <Heart size={15} color={colors.ink} />
          <Text style={styles.secondaryText}>Dos favoritos</Text>
        </Pressable>
      </ScrollView>

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
        occasionId={today?.occasionId ?? "trabalho"}
        formalityId={today?.formalityId ?? "casual_arrumado"}
        temp={today?.temp}
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
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink, marginTop: 4 },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 6, marginBottom: 16 },
  pickerCard: {
    backgroundColor: colors.creamWarm,
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
  },
  hero: {
    width: "100%",
    height: 300,
    borderRadius: 24,
    backgroundColor: colors.creamDark,
  },
  heroEmpty: { alignItems: "center", justifyContent: "center", padding: 24 },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 21,
    marginTop: 16,
    marginBottom: 24,
  },
  section: {
    fontFamily: fonts.displayMedium,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 12,
  },
  pieceRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
  },
  thumb: {
    width: 72,
    height: 88,
    borderRadius: 14,
    backgroundColor: colors.creamDark,
  },
  pieceRole: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pieceName: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, marginTop: 2 },
  pieceSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  pieceStatus: { fontFamily: fonts.mono, fontSize: 10, color: colors.goldDark, marginTop: 4 },
  swapBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  addPieceBtn: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 14,
    backgroundColor: colors.creamWarm,
  },
  addPieceText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  primary: {
    marginTop: 16,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
  rowActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  secondary: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  secondaryText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  secondarySaved: {
    borderColor: colors.gold,
    backgroundColor: colors.creamWarm,
  },
  secondaryTextSaved: { color: colors.goldDark },
  disabled: { opacity: 0.45 },
  });
}
