import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, ChevronRight, Cloud, HelpCircle, Shield } from "lucide-react-native";
import { STYLE_TAG_OPTIONS } from "@/data/types";
import { searchCities, type GeoCity } from "@/lib/weather";
import { useAuth } from "@/store/auth-store";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function ProfileScreen() {
  const router = useRouter();
  const { preferences, updatePreferences, refreshWeather } = useWardrobe();
  const { configured, user } = useAuth();
  const [name, setName] = useState(preferences.displayName);
  const [cityQuery, setCityQuery] = useState(preferences.city);
  const [cities, setCities] = useState<GeoCity[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setName(preferences.displayName);
    setCityQuery(preferences.city);
  }, [preferences.displayName, preferences.city]);

  useEffect(() => {
    if (cityQuery.trim().length < 2 || cityQuery === preferences.city) {
      setCities([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        setCities(await searchCities(cityQuery));
      } catch {
        setCities([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [cityQuery, preferences.city]);

  const toggleTag = async (tag: string) => {
    const has = preferences.styleTags.includes(tag);
    const styleTags = has
      ? preferences.styleTags.filter((t) => t !== tag)
      : [...preferences.styleTags, tag];
    await updatePreferences({ styleTags });
  };

  const saveName = async () => {
    await updatePreferences({ displayName: name.trim() || preferences.displayName });
    Alert.alert("Salvo", "Nome atualizado.");
  };

  const pickCity = async (c: GeoCity) => {
    const label = c.admin1 ? `${c.name}, ${c.admin1}` : c.name;
    setCityQuery(label);
    setCities([]);
    await refreshWeather({
      city: label,
      latitude: c.latitude,
      longitude: c.longitude,
    });
    Alert.alert("Cidade atualizada", `Clima de ${label}: máxima e mínima sincronizadas.`);
  };

  const menu = [
    {
      icon: Cloud,
      label: "Conta e sync",
      sub: user ? user.email ?? "Conectada" : configured ? "Entrar para sincronizar" : "Modo local",
      href: "/account" as const,
    },
    {
      icon: Bell,
      label: "Notificações",
      sub: "Lembrete do look de amanhã",
      href: "/notifications" as const,
    },
    {
      icon: Shield,
      label: "Privacidade",
      sub: "Como usamos seus dados",
      href: "/privacy" as const,
    },
    {
      icon: HelpCircle,
      label: "Suporte",
      sub: "Dicas rápidas do app",
      onPress: () =>
        Alert.alert(
          "Suporte",
          "1) Adicione peças no + com foto\n2) Ajuste ocasião no look do dia\n3) Peça looks no Stylist\n4) Planeje a semana e marque usei"
        ),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Stylist pessoal</Text>
          <Text style={styles.name}>{preferences.displayName || "Você"}</Text>
          <Text style={styles.city}>{preferences.city || "Defina sua cidade"}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user ? "Conta ativa" : "Local"}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Nome</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />
          <Pressable style={styles.saveBtn} onPress={saveName}>
            <Text style={styles.saveText}>Salvar nome</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Cidade / clima</Text>
          <TextInput
            value={cityQuery}
            onChangeText={setCityQuery}
            placeholder="Buscar cidade"
            placeholderTextColor={colors.soft}
            style={styles.input}
          />
          {searching && <ActivityIndicator style={{ marginTop: 10 }} color={colors.gold} />}
          {cities.map((c) => (
            <Pressable
              key={`${c.latitude}-${c.longitude}`}
              style={styles.cityRow}
              onPress={() => pickCity(c)}
            >
              <Text style={styles.cityRowText}>
                {[c.name, c.admin1, c.country].filter(Boolean).join(", ")}
              </Text>
            </Pressable>
          ))}
          <Pressable style={[styles.saveBtn, { marginTop: 12 }]} onPress={() => refreshWeather()}>
            <Text style={styles.saveText}>Atualizar clima</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Seu estilo</Text>
          <View style={styles.tags}>
            {STYLE_TAG_OPTIONS.map((tag) => {
              const on = preferences.styleTags.includes(tag);
              return (
                <Pressable key={tag} onPress={() => toggleTag(tag)} style={[styles.tag, on && styles.tagOn]}>
                  <Text style={[styles.tagText, on && styles.tagTextOn]}>{tag}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.menu}>
          {menu.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Pressable
                key={item.label}
                style={[styles.menuRow, idx < menu.length - 1 && styles.menuBorder]}
                onPress={() => (item.href ? router.push(item.href) : item.onPress?.())}
              >
                <View style={styles.menuIcon}>
                  <Icon size={13} color={colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub}>{item.sub}</Text>
                </View>
                <ChevronRight size={14} color={colors.soft} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: 28,
    padding: 24,
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  name: { fontFamily: fonts.display, fontSize: 22, color: colors.white, marginTop: 8 },
  city: { fontFamily: fonts.body, fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 16,
    backgroundColor: colors.gold,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 20, marginBottom: 16 },
  cardLabel: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: colors.ink,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.white },
  cityRow: {
    marginTop: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cityRowText: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: colors.creamDark,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagOn: { backgroundColor: colors.ink },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.ink },
  tagTextOn: { color: colors.white },
  menu: { backgroundColor: colors.white, borderRadius: 20, overflow: "hidden" },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.cream,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  menuSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 2 },
});
