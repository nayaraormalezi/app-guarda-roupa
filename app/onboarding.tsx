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
import { STYLE_TAG_OPTIONS } from "@/data/types";
import { searchCities, type GeoCity } from "@/lib/weather";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

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

  const finish = async () => {
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
      router.replace("/(tabs)");
    } catch {
      setError("Não foi possível salvar. Tente de novo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>Personal Stylist</Text>
        <Text style={styles.title}>
          {step === 0 && "Como podemos te chamar?"}
          {step === 1 && "Onde você mora?"}
          {step === 2 && "Qual o seu estilo?"}
        </Text>
        <Text style={styles.sub}>
          {step === 0 && "Usamos seu nome na Home e na Stylist."}
          {step === 1 && "Para clima real e looks adequados ao dia."}
          {step === 2 && "Toque nas tags que combinam com você."}
        </Text>

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

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          {step > 0 && (
            <Pressable style={styles.secondary} onPress={() => setStep((s) => s - 1)}>
              <Text style={styles.secondaryText}>Voltar</Text>
            </Pressable>
          )}
          {step < 2 ? (
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
            <Pressable style={[styles.primary, saving && { opacity: 0.6 }]} onPress={finish} disabled={saving}>
              <Text style={styles.primaryText}>{saving ? "Preparando…" : "Começar"}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 28, paddingTop: 48, paddingBottom: 40 },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: { fontFamily: fonts.display, fontSize: 32, color: colors.ink, marginTop: 12 },
  sub: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, marginTop: 10, marginBottom: 28, lineHeight: 20 },
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
