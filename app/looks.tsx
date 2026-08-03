import React from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
import { getOccasion } from "@/data/types";
import { outfitPieces } from "@/lib/outfit-engine";
import { useWardrobe } from "@/store/wardrobe-store";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function LooksScreen() {
  const router = useRouter();
  const { savedLooks, resolveLook, deleteLook } = useWardrobe();

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <FlatList
        data={savedLooks}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum look salvo</Text>
            <Text style={styles.emptySub}>Salve looks pela Home ou pela Stylist.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const outfit = resolveLook(item);
          const pieces = outfitPieces(outfit);
          const occ = item.occasionId ? getOccasion(item.occasionId) : null;
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/look/${item.id}`)}>
              <View style={styles.thumbs}>
                {pieces.slice(0, 4).map(({ item: p }) => (
                  <Image key={p.id} source={{ uri: p.img }} style={styles.thumb} />
                ))}
                {pieces.length === 0 && (
                  <View style={[styles.thumb, { backgroundColor: colors.creamDark }]} />
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {occ ? `${occ.emoji} ${occ.label} · ` : ""}
                  {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  {pieces.length ? ` · ${pieces.length} peças` : " · peças removidas"}
                </Text>
              </View>
              <Pressable
                hitSlop={12}
                onPress={() =>
                  Alert.alert("Apagar look", `Remover “${item.name}”?`, [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Apagar", style: "destructive", onPress: () => deleteLook(item.id) },
                  ])
                }
              >
                <Trash2 size={16} color={colors.soft} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  list: { padding: 24, gap: 12, paddingBottom: 40 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 8 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumbs: { flexDirection: "row", gap: 4 },
  thumb: { width: 40, height: 48, borderRadius: 8, backgroundColor: colors.creamDark },
  body: { flex: 1 },
  name: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, marginTop: 4 },
});
