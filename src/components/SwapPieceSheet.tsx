import React from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ClothingItem } from "@/data/types";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

interface Props {
  visible: boolean;
  title: string;
  alternatives: ClothingItem[];
  onClose: () => void;
  onSelect: (item: ClothingItem) => void;
}

export function SwapPieceSheet({ visible, title, alternatives, onClose, onSelect }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>Alternativas ranqueadas do seu guarda-roupa</Text>
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {alternatives.length === 0 ? (
            <Text style={styles.empty}>Nenhuma alternativa disponível nesta categoria.</Text>
          ) : (
            alternatives.map((item) => (
              <Pressable key={item.id} style={styles.row} onPress={() => onSelect(item)}>
                <Image source={{ uri: item.img }} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.brand} · {item.color} · {item.style}
                  </Text>
                </View>
                <Text style={styles.pick}>Trocar</Text>
              </Pressable>
            ))
          )}
        </ScrollView>
        <Pressable style={styles.done} onPress={onClose}>
          <Text style={styles.doneText}>Fechar</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
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
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, paddingVertical: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  thumb: { width: 56, height: 68, borderRadius: 12, backgroundColor: colors.creamDark },
  name: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
  pick: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.goldDark },
  done: {
    marginTop: 16,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
});
