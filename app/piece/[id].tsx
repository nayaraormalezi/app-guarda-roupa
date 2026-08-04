import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
import { DropdownField } from "@/components/DropdownField";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  COLOR_OPTIONS,
  FORMALITY_LABEL,
  FORMALITY_OPTIONS,
  OCCASION_OPTIONS,
  SEASON_OPTIONS,
  STATUS_LABEL,
  STATUS_OPTIONS,
  STYLE_OPTIONS,
  SUBCATEGORIES,
  colorHexFor,
  defaultSubcategory,
  isTallCategory,
  normalizeFormality,
} from "@/data/catalog";
import type { Category, FormalityId, Status } from "@/data/types";
import { useWardrobe } from "@/store/wardrobe-store";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function PieceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getItem, updateItem, deleteItem } = useWardrobe();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const item = getItem(id);

  const [name, setName] = useState(item?.name ?? "");
  const [brand, setBrand] = useState(item?.brand ?? "");
  const [category, setCategory] = useState<Category>(item?.category ?? "superiores");
  const [subcategory, setSubcategory] = useState(item?.subcategory ?? defaultSubcategory("superiores"));
  const [color, setColor] = useState(item?.color ?? COLOR_OPTIONS[0]);
  const [style, setStyle] = useState(item?.style ?? STYLE_OPTIONS[0]);
  const [season, setSeason] = useState(item?.season ?? "Todos");
  const [occasion, setOccasion] = useState(item?.occasion ?? "Todos");
  const [formality, setFormality] = useState<FormalityId | "todos">(
    normalizeFormality(item?.formality)
  );
  const [status, setStatus] = useState<Status>(item?.status ?? "available");
  const [saving, setSaving] = useState(false);

  const categoryOptions = CATEGORIES.map((c) => CATEGORY_LABELS[c]);
  const subcategoryOptions = SUBCATEGORIES[category];
  const colorOptions = useMemo(() => {
    const set = new Set<string>([...COLOR_OPTIONS]);
    if (color) set.add(color);
    return Array.from(set);
  }, [color]);
  const styleOptions = useMemo(() => {
    const set = new Set<string>([...STYLE_OPTIONS]);
    if (style) set.add(style);
    return Array.from(set);
  }, [style]);

  const dirty = useMemo(() => {
    if (!item) return false;
    return (
      name !== item.name ||
      brand !== item.brand ||
      category !== item.category ||
      subcategory !== item.subcategory ||
      color !== item.color ||
      style !== item.style ||
      season !== item.season ||
      occasion !== item.occasion ||
      formality !== normalizeFormality(item.formality) ||
      status !== item.status
    );
  }, [item, name, brand, category, subcategory, color, style, season, occasion, formality, status]);

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Peça não encontrada</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Voltar</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const onCategoryChange = (label: string) => {
    const next = CATEGORIES.find((c) => CATEGORY_LABELS[c] === label);
    if (!next) return;
    setCategory(next);
    setSubcategory(defaultSubcategory(next));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateItem(item.id, {
        name: name.trim() || item.name,
        brand: brand.trim() || item.brand,
        category,
        subcategory,
        color,
        colorHex: colorHexFor(color),
        style,
        season,
        occasion,
        formality,
        status,
        tall: isTallCategory(category),
      });
      Alert.alert("Salvo", "Alterações da peça atualizadas.");
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    Alert.alert("Apagar peça", `Remover “${item.name}” do guarda-roupa?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Apagar",
        style: "destructive",
        onPress: async () => {
          await deleteItem(item.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Image source={{ uri: item.img }} style={styles.img} />
        <Text style={styles.meta}>
          {item.uses}× usos · {CATEGORY_LABELS[item.category]} · {item.subcategory}
        </Text>

        <Field label="Nome" value={name} onChangeText={setName} styles={styles} />
        <Field label="Marca" value={brand} onChangeText={setBrand} styles={styles} />

        <DropdownField
          label="Categoria"
          value={CATEGORY_LABELS[category]}
          options={categoryOptions}
          onChange={onCategoryChange}
        />
        <DropdownField
          label="Tipo"
          value={subcategory}
          options={subcategoryOptions}
          onChange={setSubcategory}
        />
        <DropdownField label="Cor" value={color} options={colorOptions} onChange={setColor} />
        <DropdownField label="Estilo" value={style} options={styleOptions} onChange={setStyle} />
        <DropdownField
          label="Estação"
          value={season}
          options={[...SEASON_OPTIONS]}
          onChange={setSeason}
        />
        <DropdownField
          label="Ocasião"
          value={occasion}
          options={[...OCCASION_OPTIONS]}
          onChange={setOccasion}
        />
        <DropdownField
          label="Formalidade"
          value={FORMALITY_LABEL[formality]}
          options={FORMALITY_OPTIONS.map((f) => f.label)}
          onChange={(label) => {
            const found = FORMALITY_OPTIONS.find((f) => f.label === label);
            if (found) setFormality(found.id);
          }}
        />
        <DropdownField
          label="Status"
          value={STATUS_LABEL[status]}
          options={STATUS_OPTIONS.map((s) => s.label)}
          onChange={(label) => {
            const found = STATUS_OPTIONS.find((s) => s.label === label);
            if (found) setStatus(found.id);
          }}
        />

        <Pressable
          style={[styles.save, (!dirty || saving) && { opacity: 0.5 }]}
          onPress={save}
          disabled={!dirty || saving}
        >
          <Text style={styles.saveText}>{saving ? "Salvando…" : "Salvar alterações"}</Text>
        </Pressable>

        <Pressable style={styles.delete} onPress={remove}>
          <Trash2 size={16} color="#B91C1C" />
          <Text style={styles.deleteText}>Apagar peça</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  styles,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, paddingBottom: 40 },
  img: { width: "100%", height: 280, borderRadius: 24, backgroundColor: colors.creamDark, marginBottom: 12 },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginBottom: 16 },
  label: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
  },
  save: {
    marginTop: 8,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
  delete: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  deleteText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: "#B91C1C" },
  missing: { fontFamily: fonts.display, fontSize: 20, color: colors.ink, textAlign: "center", marginTop: 80 },
  backLink: { fontFamily: fonts.bodyMedium, color: colors.goldDark, textAlign: "center", marginTop: 16 },
  });
}
