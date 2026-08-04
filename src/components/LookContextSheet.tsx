import React, { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LookContextPicker } from "@/components/LookContextPicker";
import type { FormalityId, OccasionId } from "@/data/types";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export function LookContextSheet({
  visible,
  occasionId,
  formalityId,
  onOccasionChange,
  onFormalityChange,
  onClose,
  title = "Look de hoje",
}: {
  visible: boolean;
  occasionId: OccasionId;
  formalityId: FormalityId;
  onOccasionChange: (id: OccasionId) => void;
  onFormalityChange: (id: FormalityId) => void;
  onClose: () => void;
  title?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>Escolha a ocasião e a formalidade</Text>
          <LookContextPicker
            occasionId={occasionId}
            formalityId={formalityId}
            onOccasionChange={onOccasionChange}
            onFormalityChange={onFormalityChange}
          />
          <Pressable style={styles.done} onPress={onClose}>
            <Text style={styles.doneText}>Pronto</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.creamDark,
    marginBottom: 14,
  },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 4, marginBottom: 16 },
  done: {
    marginTop: 20,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
  });
}
