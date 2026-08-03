import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, Search } from "lucide-react-native";
import { searchCities, type GeoCity } from "@/lib/weather";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export function CityPickerSheet({
  visible,
  currentCity,
  onClose,
  onSelect,
}: {
  visible: boolean;
  currentCity?: string;
  onClose: () => void;
  onSelect: (city: GeoCity, label: string) => void | Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setCities([]);
    setSaving(false);
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (query.trim().length < 2) {
      setCities([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setCities(await searchCities(query));
      } catch {
        setCities([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, visible]);

  const pick = async (c: GeoCity) => {
    const label = [c.name, c.admin1].filter(Boolean).join(", ");
    setSaving(true);
    try {
      await onSelect(c, label);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Trocar cidade</Text>
          {!!currentCity && <Text style={styles.current}>Atual: {currentCity}</Text>}

          <View style={styles.search}>
            <Search size={16} color={colors.soft} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Digite a cidade…"
              placeholderTextColor={colors.soft}
              style={styles.input}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>

          {(searching || saving) && (
            <ActivityIndicator style={{ marginTop: 16 }} color={colors.gold} />
          )}

          <FlatList
            data={cities}
            keyExtractor={(c) => `${c.latitude}-${c.longitude}-${c.name}`}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {query.trim().length < 2
                  ? "Digite o nome da cidade para buscar"
                  : searching
                    ? ""
                    : "Nenhuma cidade encontrada"}
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => pick(item)} disabled={saving}>
                <MapPin size={14} color={colors.goldDark} />
                <Text style={styles.rowText}>
                  {[item.name, item.admin1, item.country].filter(Boolean).join(", ")}
                </Text>
              </Pressable>
            )}
          />

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    zIndex: 2,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    minHeight: 360,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.creamDark,
    marginBottom: 14,
  },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  current: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 14,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.cream,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    padding: 0,
    minHeight: 22,
  },
  list: { maxHeight: 280, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  empty: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    marginTop: 28,
  },
  cancel: { marginTop: 8, alignItems: "center", paddingVertical: 14 },
  cancelText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.muted },
});
