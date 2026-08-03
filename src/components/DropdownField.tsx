import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ChevronDown } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export function DropdownField({
  label,
  value,
  options,
  onChange,
  placeholder = "Selecionar",
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              style={{ maxHeight: 360 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const on = item === value;
                return (
                  <Pressable
                    style={[styles.option, on && styles.optionOn]}
                    onPress={() => {
                      onChange(item);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, on && styles.optionTextOn]}>{item}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  trigger: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  value: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  placeholder: { color: colors.soft },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 12,
  },
  option: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionOn: { backgroundColor: colors.creamWarm },
  optionText: { fontFamily: fonts.body, fontSize: 14, color: colors.ink, paddingHorizontal: 4 },
  optionTextOn: { fontFamily: fonts.bodyMedium, color: colors.goldDark },
});
