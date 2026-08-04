import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Check, CheckCircle2, Image as ImageIcon, Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
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
} from "@/data/catalog";
import type { Category, FormalityId, Status } from "@/data/types";
import { analyzeClothingImage, friendlyVisionError, resolveVisionApiKey } from "@/lib/analyze-clothing";
import { useWardrobe } from "@/store/wardrobe-store";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

type Phase = "capture" | "analyzing" | "form" | "saving" | "done";

export default function AddScreen() {
  const router = useRouter();
  const { addItem } = useWardrobe();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [phase, setPhase] = useState<Phase>("capture");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [aiFilled, setAiFilled] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<Category>("superiores");
  const [subcategory, setSubcategory] = useState(defaultSubcategory("superiores"));
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);
  const [style, setStyle] = useState<string>(STYLE_OPTIONS[1]);
  const [season, setSeason] = useState<string>("Todos");
  const [occasion, setOccasion] = useState<string>("Todos");
  const [formality, setFormality] = useState<FormalityId | "todos">("todos");
  const [status, setStatus] = useState<Status>("available");

  const reset = () => {
    setPhase("capture");
    setImageUri(null);
    setAiFilled(false);
    setAiNote(null);
    setName("");
    setBrand("");
    setCategory("superiores");
    setSubcategory(defaultSubcategory("superiores"));
    setColor(COLOR_OPTIONS[0]);
    setStyle(STYLE_OPTIONS[1]);
    setSeason("Todos");
    setOccasion("Todos");
    setFormality("todos");
    setStatus("available");
  };

  const onCategoryChange = (label: string) => {
    const next = CATEGORIES.find((c) => CATEGORY_LABELS[c] === label);
    if (!next) return;
    setCategory(next);
    setSubcategory(defaultSubcategory(next));
  };

  const applyAnalysis = async (uri: string) => {
    setPhase("analyzing");
    setAiFilled(false);
    setAiNote(null);
    try {
      if (!resolveVisionApiKey()) {
        setAiNote(
          "Análise automática indisponível. Entre na conta (usa IA no servidor) ou configure a chave Gemini."
        );
        setPhase("form");
        return;
      }
      const result = await analyzeClothingImage(uri);
      setName(result.name);
      setBrand(result.brand === "Sem marca" ? "" : result.brand);
      setCategory(result.category);
      setSubcategory(result.subcategory);
      setColor(result.color);
      setStyle(result.style);
      setSeason(result.season);
      setOccasion(result.occasion);
      setFormality(result.formality);
      setAiFilled(true);
      setAiNote(
        result.confidence === "low"
          ? "Sugestão automática com baixa confiança — revise os campos."
          : "Campos preenchidos automaticamente a partir da foto. Você pode ajustar."
      );
    } catch (e) {
      setAiNote(friendlyVisionError(e));
    } finally {
      setPhase("form");
    }
  };

  const pick = async (from: "camera" | "library") => {
    const permission =
      from === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Habilite o acesso nas Configurações do iPhone.");
      return;
    }

    const result =
      from === "camera"
        ? await ImagePicker.launchCameraAsync({
            quality: 0.45,
            allowsEditing: true,
            aspect: [3, 4],
          })
        : await ImagePicker.launchImageLibraryAsync({
            quality: 0.45,
            allowsEditing: true,
            aspect: [3, 4],
          });

    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setImageUri(uri);
    await applyAnalysis(uri);
  };

  const save = async () => {
    if (!imageUri) return;
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Dê um nome para a peça.");
      return;
    }
    setPhase("saving");
    try {
      await addItem({
        name: name.trim(),
        brand: brand.trim() || "Sem marca",
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
        imageUri,
      });
      setPhase("done");
      setTimeout(() => {
        reset();
        router.replace("/(tabs)/closet");
      }, 1400);
    } catch (e) {
      setPhase("form");
      Alert.alert("Erro", e instanceof Error ? e.message : "Não foi possível salvar a peça.");
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Adicionar peça</Text>
        <Text style={styles.sub}>Foto · IA preenche os campos · você revisa</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {phase === "capture" && (
          <View>
            <View style={styles.cameraBox}>
              <Camera size={28} color={colors.white} />
              <Text style={styles.cameraText}>Fotografe ou escolha da galeria</Text>
              <Text style={styles.cameraHint}>A IA identifica categoria, cor e estilo</Text>
            </View>
            <Pressable style={styles.primary} onPress={() => pick("camera")}>
              <Camera size={16} color={colors.white} />
              <Text style={styles.primaryText}>Fotografar agora</Text>
            </Pressable>
            <Pressable style={styles.secondary} onPress={() => pick("library")}>
              <ImageIcon size={16} color={colors.ink} />
              <Text style={styles.secondaryText}>Enviar da galeria</Text>
            </Pressable>
          </View>
        )}

        {phase === "analyzing" && imageUri && (
          <View style={styles.analyzing}>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            <ActivityIndicator color={colors.gold} size="large" />
            <View style={styles.analyzingRow}>
              <Sparkles size={16} color={colors.goldDark} />
              <Text style={styles.analyzingTitle}>Analisando a peça…</Text>
            </View>
            <Text style={styles.analyzingSub}>Identificando categoria, cor, estilo e formalidade</Text>
          </View>
        )}

        {(phase === "form" || phase === "saving") && imageUri && (
          <View>
            <Image source={{ uri: imageUri }} style={styles.preview} />
            {aiNote && (
              <View style={[styles.aiBanner, aiFilled && styles.aiBannerOk]}>
                <Sparkles size={14} color={aiFilled ? colors.goldDark : colors.muted} />
                <Text style={styles.aiBannerText}>{aiNote}</Text>
              </View>
            )}
            <Pressable
              style={styles.reanalyze}
              onPress={() => imageUri && applyAnalysis(imageUri)}
            >
              <Text style={styles.reanalyzeText}>Reanalisar foto com IA</Text>
            </Pressable>

            <Field
              label="Nome"
              value={name}
              onChangeText={setName}
              placeholder="Ex: Blusa seda preta"
              colors={colors}
              styles={styles}
            />
            <Field
              label="Marca"
              value={brand}
              onChangeText={setBrand}
              placeholder="Ex: Theory"
              colors={colors}
              styles={styles}
            />

            <DropdownField
              label="Categoria"
              value={CATEGORY_LABELS[category]}
              options={CATEGORIES.map((c) => CATEGORY_LABELS[c])}
              onChange={onCategoryChange}
            />
            <DropdownField
              label="Tipo"
              value={subcategory}
              options={SUBCATEGORIES[category]}
              onChange={setSubcategory}
            />
            <DropdownField
              label="Cor"
              value={color}
              options={[...COLOR_OPTIONS]}
              onChange={setColor}
            />
            <DropdownField
              label="Estilo"
              value={style}
              options={[...STYLE_OPTIONS]}
              onChange={setStyle}
            />
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

            <Pressable style={[styles.primary, { marginTop: 20 }]} onPress={save} disabled={phase === "saving"}>
              {phase === "saving" ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Check size={16} color={colors.white} />
                  <Text style={styles.primaryText}>Confirmar e adicionar</Text>
                </>
              )}
            </Pressable>
            <Pressable style={{ marginTop: 12, alignItems: "center" }} onPress={reset}>
              <Text style={styles.ghost}>Tirar outra foto</Text>
            </Pressable>
          </View>
        )}

        {phase === "done" && (
          <View style={styles.done}>
            <CheckCircle2 size={40} color={colors.success} />
            <Text style={styles.doneTitle}>Pronto.</Text>
            <Text style={styles.doneSub}>Peça salva no seu guarda-roupa.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  styles,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  colors: ThemeColors;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.soft}
        style={styles.field}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  title: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 4 },
  content: { paddingHorizontal: 24, paddingBottom: 40 },
  cameraBox: {
    height: 280,
    borderRadius: 24,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  cameraText: { fontFamily: fonts.body, fontSize: 13, color: colors.onInk, opacity: 0.8, textAlign: "center" },
  cameraHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.onInk, opacity: 0.45, textAlign: "center" },
  primary: {
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
  secondary: {
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.white,
  },
  secondaryText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: colors.creamDark,
  },
  analyzing: { alignItems: "center", gap: 12 },
  analyzingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  analyzingTitle: { fontFamily: fonts.displayMedium, fontSize: 18, color: colors.ink },
  analyzingSub: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: "center" },
  aiBanner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    backgroundColor: colors.creamWarm,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  aiBannerOk: { backgroundColor: colors.creamDark },
  aiBannerText: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.ink, lineHeight: 17 },
  reanalyze: { alignItems: "center", marginBottom: 14 },
  reanalyzeText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.goldDark },
  fieldLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  field: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
  },
  ghost: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  done: { alignItems: "center", paddingTop: 80, gap: 8 },
  doneTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  doneSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  });
}
