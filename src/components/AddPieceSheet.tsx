import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ClothingItem, FormalityId, OccasionId, Outfit } from "@/data/types";
import {
  alternativesForSlot,
  emptyOutfitSlots,
  slotLabel,
  type OutfitSlot,
} from "@/lib/outfit-engine";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

interface Props {
  visible: boolean;
  wardrobe: ClothingItem[];
  outfit: Outfit | null;
  occasionId: OccasionId;
  formalityId: FormalityId;
  temp?: number;
  onClose: () => void;
  onSelect: (slot: OutfitSlot, item: ClothingItem) => void;
}

export function AddPieceSheet({
  visible,
  wardrobe,
  outfit,
  occasionId,
  formalityId,
  temp,
  onClose,
  onSelect,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [slot, setSlot] = useState<OutfitSlot | null>(null);
  const emptySlots = useMemo(() => emptyOutfitSlots(outfit), [outfit]);

  useEffect(() => {
    if (!visible) setSlot(null);
  }, [visible]);

  const alternatives = useMemo(() => {
    if (!slot) return [];
    return alternativesForSlot(
      wardrobe,
      slot,
      occasionId,
      formalityId,
      temp,
      undefined,
      outfit ?? undefined
    );
  }, [slot, wardrobe, occasionId, formalityId, temp, outfit]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{slot ? `Adicionar ${slotLabel(slot).toLowerCase()}` : "Adicionar peça"}</Text>
        <Text style={styles.sub}>
          {slot
            ? "Escolha uma peça do seu guarda-roupa"
            : "Qual tipo de peça você quer incluir no look?"}
        </Text>

        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {!slot ? (
            emptySlots.length === 0 ? (
              <Text style={styles.empty}>
                Este look já está completo. Troque uma peça ou remova uma para liberar espaço.
              </Text>
            ) : (
              emptySlots.map((s) => (
                <Pressable key={s} style={styles.slotRow} onPress={() => setSlot(s)}>
                  <Text style={styles.slotName}>{slotLabel(s)}</Text>
                  <Text style={styles.pick}>Escolher</Text>
                </Pressable>
              ))
            )
          ) : alternatives.length === 0 ? (
            <Text style={styles.empty}>Nenhuma peça disponível nesta categoria.</Text>
          ) : (
            alternatives.map((item) => (
              <Pressable
                key={item.id}
                style={styles.row}
                onPress={() => {
                  onSelect(slot, item);
                  setSlot(null);
                }}
              >
                <Image source={{ uri: item.img }} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.brand} · {item.color} · {item.style}
                  </Text>
                </View>
                <Text style={styles.pick}>Adicionar</Text>
              </Pressable>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          {slot ? (
            <Pressable style={styles.secondary} onPress={() => setSlot(null)}>
              <Text style={styles.secondaryText}>Voltar</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.done, slot && { flex: 1 }]} onPress={onClose}>
            <Text style={styles.doneText}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
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
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginBottom: 14 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, paddingVertical: 20, lineHeight: 20 },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.creamDark,
  },
  slotName: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.creamDark,
  },
  thumb: { width: 56, height: 68, borderRadius: 12, backgroundColor: colors.creamDark },
  name: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  pick: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.goldDark },
  footer: { flexDirection: "row", gap: 8, marginTop: 12 },
  secondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  done: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
  });
}
