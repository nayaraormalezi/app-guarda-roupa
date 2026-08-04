import React, { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { OutfitCardView } from "@/components/OutfitCardView";
import { getOccasion } from "@/data/types";
import { outfitPieces } from "@/lib/outfit-engine";
import { useWardrobe } from "@/store/wardrobe-store";
import { useTheme } from "@/theme/ThemeContext";
import type { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function LookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { savedLooks, resolveLook, deleteLook, incrementUses } = useWardrobe();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const look = savedLooks.find((l) => l.id === id);

  if (!look) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Look não encontrado</Text>
      </SafeAreaView>
    );
  }

  const outfit = resolveLook(look);
  const pieces = outfitPieces(outfit);
  const occ = look.occasionId ? getOccasion(look.occasionId) : null;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{look.name}</Text>
        <Text style={styles.meta}>
          {occ ? `${occ.emoji} ${occ.label} · ` : ""}
          {new Date(look.createdAt).toLocaleDateString("pt-BR")}
        </Text>

        {pieces.length ? (
          <OutfitCardView outfit={outfit} />
        ) : (
          <Text style={styles.empty}>As peças deste look foram removidas do guarda-roupa.</Text>
        )}

        {pieces.length > 0 && (
          <Pressable
            style={styles.primary}
            onPress={() => {
              incrementUses(pieces.map((p) => p.item.id));
              Alert.alert("Look do dia", "Uso das peças registrado.");
            }}
          >
            <Text style={styles.primaryText}>Usar hoje</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.delete}
          onPress={() =>
            Alert.alert("Apagar look", `Remover “${look.name}”?`, [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Apagar",
                style: "destructive",
                onPress: async () => {
                  await deleteLook(look.id);
                  router.back();
                },
              },
            ])
          }
        >
          <Text style={styles.deleteText}>Apagar look</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: 6, marginBottom: 20 },
  empty: { fontFamily: fonts.body, color: colors.muted, marginVertical: 24 },
  primary: {
    marginTop: 20,
    backgroundColor: colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.white },
  delete: { marginTop: 16, alignItems: "center", paddingVertical: 12 },
  deleteText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: "#B91C1C" },
  missing: { fontFamily: fonts.display, fontSize: 20, textAlign: "center", marginTop: 80, color: colors.ink },
  });
}
