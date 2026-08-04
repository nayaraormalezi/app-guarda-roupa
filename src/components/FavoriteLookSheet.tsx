import React, { useMemo } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Outfit, SavedLook } from "@/data/types";
import { getOccasion } from "@/data/types";
import { outfitPieces } from "@/lib/outfit-engine";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

interface Props {
  visible: boolean;
  looks: SavedLook[];
  resolveLook: (look: SavedLook) => Outfit;
  onClose: () => void;
  onSelect: (look: SavedLook, outfit: Outfit) => void;
}

export function FavoriteLookSheet({
  visible,
  looks,
  resolveLook,
  onClose,
  onSelect,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Looks favoritos</Text>
        <Text style={styles.sub}>Escolha um look salvo para usar neste dia</Text>
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          {looks.length === 0 ? (
            <Text style={styles.empty}>
              Nenhum look favorito ainda. Salve um look pela Home ou pelo planejador.
            </Text>
          ) : (
            looks.map((look) => {
              const outfit = resolveLook(look);
              const pieces = outfitPieces(outfit);
              const occ = look.occasionId ? getOccasion(look.occasionId) : null;
              const disabled = pieces.length === 0;
              return (
                <Pressable
                  key={look.id}
                  style={[styles.row, disabled && styles.rowDisabled]}
                  disabled={disabled}
                  onPress={() => onSelect(look, outfit)}
                >
                  <View style={styles.thumbs}>
                    {pieces.slice(0, 3).map(({ item }) => (
                      <Image key={item.id} source={{ uri: item.img }} style={styles.thumb} />
                    ))}
                    {pieces.length === 0 ? (
                      <View style={[styles.thumb, { backgroundColor: colors.creamDark }]} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {look.name}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {disabled
                        ? "Peças indisponíveis"
                        : `${occ ? `${occ.emoji} ${occ.label} · ` : ""}${pieces.length} peças`}
                    </Text>
                  </View>
                  {!disabled ? <Text style={styles.pick}>Usar</Text> : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
        <Pressable style={styles.done} onPress={onClose}>
          <Text style={styles.doneText}>Fechar</Text>
        </Pressable>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.creamDark,
  },
  rowDisabled: { opacity: 0.45 },
  thumbs: { flexDirection: "row", gap: 3 },
  thumb: { width: 36, height: 44, borderRadius: 8, backgroundColor: colors.creamDark },
  name: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  pick: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.goldDark },
  done: {
    marginTop: 12,
    backgroundColor: colors.cream,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  });
}
