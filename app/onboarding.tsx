import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, Shirt, Sparkles } from "lucide-react-native";
import { STYLE_TAG_OPTIONS } from "@/data/types";
import { searchCities, type GeoCity } from "@/lib/weather";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const STEPS = [
  {
    title: "Como podemos te chamar?",
    sub: "Usamos seu nome na Home e na Stylist.",
  },
  {
    title: "Onde você mora?",
    sub: "Para clima real e looks adequados ao dia.",
  },
  {
    title: "Qual o seu estilo?",
    sub: "Toque nas tags que combinam com você.",
  },
  {
    title: "Monte seu armário",
    sub: "Quanto mais peças reais, melhores ficam os looks.",
  },
] as const;

const START_TIPS = [
  {
    icon: Camera,
    title: "Fotografe suas peças",
    body: "Na aba +, tire foto ou escolha da galeria. A IA sugere categoria, cor e estilo — você confirma.",
  },
  {
    icon: Shirt,
    title: "Comece com o essencial",
    body: "Suba 5–8 peças: 2–3 superiores, 1–2 inferiores, 1 sapato e 1 casaco ou bolsa.",
  },
  {
    icon: Sparkles,
    title: "Peça um look",
    body: "Depois, na Home ou no Stylist, peça o look do dia com a ocasião e a formalidade.",
  },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding, preferences } = useWardrobe();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(preferences.displayName || "");
  const [cityQuery, setCityQuery] = useState(preferences.city || "");
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [selected, setSelected] = useState<GeoCity | null>(
    preferences.latitude != null && preferences.longitude != null && preferences.city
      ? {
          name: preferences.city,
          country: "",
          latitude: preferences.latitude,
          longitude: preferences.longitude,
        }
      : null
  );
  const [tags, setTags] = useState<string[]>(preferences.styleTags ?? []);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cityQuery.trim().length < 2) {
      setCities([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchCities(cityQuery);
        setCities(results);
      } catch {
        setCities([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [cityQuery]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const finish = async (goToAdd: boolean) => {
    if (!selected) {
      setError("Selecione uma cidade na lista.");
      setStep(1);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await completeOnboarding({
        displayName: name.trim() || "Você",
        city: selected.admin1 ? `${selected.name}, ${selected.admin1}` : selected.name,
        styleTags: tags,
        latitude: selected.latitude,
        longitude: selected.longitude,
      });
      if (goToAdd) {
        router.replace("/(tabs)/add");
      } else {
        router.replace("/(tabs)");
      }
    } catch {
      setError("Não foi possível salvar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  };

  const current = STEPS[step];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>Personal Stylist</Text>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotOn, i < step && styles.dotDone]} />
          ))}
        </View>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.sub}>{current.sub}</Text>

        {step === 0 && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor={colors.soft}
            style={styles.input}
            autoFocus
          />
        )}

        {step === 1 && (
          <View>
            <TextInput
              value={cityQuery}
              onChangeText={(t) => {
                setCityQuery(t);
                setSelected(null);
              }}
              placeholder="Ex: São Paulo"
              placeholderTextColor={colors.soft}
              style={styles.input}
            />
            {searching && <ActivityIndicator style={{ marginTop: 12 }} color={colors.gold} />}
            <View style={styles.cityList}>
              {cities.map((c) => {
                const label = [c.name, c.admin1, c.country].filter(Boolean).join(", ");
                const on =
                  selected?.latitude === c.latitude && selected?.longitude === c.longitude;
                return (
                  <Pressable
                    key={`${c.latitude}-${c.longitude}-${c.name}`}
                    style={[styles.cityRow, on && styles.cityOn]}
                    onPress={() => {
                      setSelected(c);
                      setCityQuery(c.name);
                    }}
                  >
                    <Text style={[styles.cityText, on && { color: colors.white }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {selected && (
              <Text style={styles.selected}>
                Selecionado: {selected.name}
                {selected.admin1 ? `, ${selected.admin1}` : ""}
              </Text>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.tags}>
            {STYLE_TAG_OPTIONS.map((tag) => {
              const on = tags.includes(tag);
              return (
                <Pressable key={tag} style={[styles.tag, on && styles.tagOn]} onPress={() => toggleTag(tag)}>
                  <Text style={[styles.tagText, on && styles.tagTextOn]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {step === 3 && (
          <View style={styles.tips}>
            {START_TIPS.map(({ icon: Icon, title, body }) => (
              <View key={title} style={styles.tipCard}>
                <View style={styles.tipIcon}>
                  <Icon size={16} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipTitle}>{title}</Text>
                  <Text style={styles.tipBody}>{body}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.tipFoot}>
              Dica: fotos com fundo limpo e boa luz ajudam a IA a reconhecer a peça.
            </Text>
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          {step > 0 && (
            <Pressable style={styles.secondary} onPress={() => setStep((s) => s - 1)} disabled={saving}>
              <Text style={styles.secondaryText}>Voltar</Text>
            </Pressable>
          )}
          {step < 3 ? (
            <Pressable
              style={[
                styles.primary,
                step === 0 && !name.trim() && { opacity: 0.5 },
                step === 1 && !selected && { opacity: 0.5 },
              ]}
              disabled={(step === 0 && !name.trim()) || (step === 1 && !selected)}
              onPress={() => setStep((s) => s + 1)}
            >
              <Text style={styles.primaryText}>Continuar</Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={[styles.primary, saving && { opacity: 0.6 }]}
                onPress={() => finish(true)}
                disabled={saving}
              >
                <Text style={styles.primaryText}>
                  {saving ? "Preparando…" : "Adicionar minha primeira peça"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.secondary}
                onPress={() => finish(false)}
                disabled={saving}
              >
                <Text style={styles.secondaryText}>Ir para a Home</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 28, paddingTop: 40, paddingBottom: 40 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  dots: { flexDirection: "row", gap: 6, marginTop: 16, marginBottom: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.creamDark,
  },
  dotOn: { backgroundColor: colors.ink, width: 18 },
  dotDone: { backgroundColor: colors.gold },
  title: { fontFamily: fonts.display, fontSize: 30, color: colors.ink, marginTop: 12 },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    marginTop: 10,
    marginBottom: 28,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
  },
  cityList: { marginTop: 12, gap: 8 },
  cityRow: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cityOn: { backgroundColor: colors.ink },
  cityText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  selected: { fontFamily: fonts.body, fontSize: 12, color: colors.goldDark, marginTop: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: {
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tagOn: { backgroundColor: colors.ink },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  tagTextOn: { color: colors.white },
  tips: { gap: 12 },
  tipCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
  },
  tipIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.creamWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  tipTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
  tipBody: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 4,
    lineHeight: 18,
  },
  tipFoot: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.goldDark,
    marginTop: 4,
    lineHeight: 18,
  },
  error: { fontFamily: fonts.body, fontSize: 12, color: "#B91C1C", marginTop: 16 },
  actions: { marginTop: 36, gap: 10 },
  primary: {
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.white },
  secondary: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  secondaryText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
});
