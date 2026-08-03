import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, SlidersHorizontal } from "lucide-react-native";
import { EmptyState } from "@/components/EmptyState";
import { PieceCard } from "@/components/PieceCard";
import { DropdownField } from "@/components/DropdownField";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  COLOR_OPTIONS,
  STATUS_LABEL,
  STATUS_OPTIONS,
  STYLE_OPTIONS,
} from "@/data/catalog";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const CATEGORY_CHIPS: { id: string; label: string }[] = [
  { id: "Todos", label: "Todos" },
  ...CATEGORIES.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
];

export default function ClosetScreen() {
  const router = useRouter();
  const { wardrobe, filterWardrobe } = useWardrobe();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [brand, setBrand] = useState("Todas");
  const [color, setColor] = useState("Todas");
  const [style, setStyle] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const brandOptions = useMemo(() => {
    const set = new Set(wardrobe.map((i) => i.brand).filter(Boolean));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [wardrobe]);

  const colorOptions = useMemo(() => {
    const set = new Set([...COLOR_OPTIONS, ...wardrobe.map((i) => i.color)].filter(Boolean));
    return ["Todas", ...Array.from(set)];
  }, [wardrobe]);

  const styleOptions = useMemo(() => {
    const set = new Set([...STYLE_OPTIONS, ...wardrobe.map((i) => i.style)].filter(Boolean));
    return ["Todos", ...Array.from(set)];
  }, [wardrobe]);

  const statusOptions = useMemo(
    () => ["Todos", ...STATUS_OPTIONS.map((s) => STATUS_LABEL[s.id])],
    []
  );

  const statusFilterId = useMemo(() => {
    if (status === "Todos") return "Todos";
    const found = STATUS_OPTIONS.find((s) => STATUS_LABEL[s.id] === status);
    return found?.id ?? "Todos";
  }, [status]);

  const activeExtraFilters =
    (brand !== "Todas" ? 1 : 0) +
    (color !== "Todas" ? 1 : 0) +
    (style !== "Todos" ? 1 : 0) +
    (status !== "Todos" ? 1 : 0);

  const items = filterWardrobe({
    query: search,
    category,
    brand,
    color,
    style,
    status: statusFilterId,
  });

  const clearExtra = () => {
    setBrand("Todas");
    setColor("Todas");
    setStyle("Todos");
    setStatus("Todos");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Guarda-Roupa</Text>
          <View style={styles.count}>
            <Text style={styles.countText}>{wardrobe.length}</Text>
          </View>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Search size={14} color={colors.soft} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar peça, marca, cor..."
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
          </View>
          <Pressable
            style={[styles.filterBtn, (filtersOpen || activeExtraFilters > 0) && styles.filterBtnOn]}
            onPress={() => setFiltersOpen((v) => !v)}
          >
            <SlidersHorizontal
              size={16}
              color={filtersOpen || activeExtraFilters > 0 ? colors.white : colors.ink}
            />
            {activeExtraFilters > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeExtraFilters}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <FlatList
          horizontal
          data={CATEGORY_CHIPS}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setCategory(item.id)}
              style={[styles.chip, category === item.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, category === item.id && styles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />

        {filtersOpen && (
          <View style={styles.filtersPanel}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filtros</Text>
              {activeExtraFilters > 0 && (
                <Pressable onPress={clearExtra}>
                  <Text style={styles.clearText}>Limpar</Text>
                </Pressable>
              )}
            </View>
            <DropdownField label="Marca" value={brand} options={brandOptions} onChange={setBrand} />
            <DropdownField label="Cor" value={color} options={colorOptions} onChange={setColor} />
            <DropdownField label="Estilo" value={style} options={styleOptions} onChange={setStyle} />
            <DropdownField
              label="Status"
              value={status}
              options={statusOptions}
              onChange={setStatus}
            />
          </View>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 24 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <EmptyState
            title={wardrobe.length === 0 ? "Closet vazio" : "Nenhuma peça encontrada"}
            subtitle={
              wardrobe.length === 0
                ? "Adicione sua primeira peça pela aba + com foto e detalhes."
                : "Ajuste a busca ou os filtros para ver outras peças."
            }
            cta={wardrobe.length === 0 ? "Adicionar peça" : undefined}
            onPress={wardrobe.length === 0 ? () => router.push("/(tabs)/add") : undefined}
          />
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <PieceCard item={item} onPress={() => router.push(`/piece/${item.id}`)} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, gap: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  count: {
    backgroundColor: colors.creamDark,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countText: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  searchRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    padding: 0,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnOn: { backgroundColor: colors.ink },
  filterBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.goldDark,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: { fontFamily: fonts.mono, fontSize: 9, color: colors.white },
  chip: {
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.ink },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.muted },
  chipTextActive: { color: colors.white },
  filtersPanel: {
    backgroundColor: colors.creamWarm,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  filtersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  filtersTitle: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  clearText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.goldDark },
  empty: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.muted,
    textAlign: "center",
    marginTop: 64,
  },
});
