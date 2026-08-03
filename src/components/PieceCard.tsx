import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ClothingItem } from "@/data/types";
import { StatusBadge } from "@/components/StatusBadge";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export function PieceCard({ item, onPress }: { item: ClothingItem; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View>
        <Image
          source={{ uri: item.img }}
          style={[styles.img, { height: item.tall ? 208 : 144 }]}
        />
        <View style={styles.badgeWrap}>
          <StatusBadge status={item.status} />
        </View>
      </View>
      <View style={styles.meta}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: item.colorHex }]} />
          <Text style={styles.brand}>{item.brand}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 12,
  },
  img: {
    width: "100%",
    backgroundColor: colors.creamDark,
  },
  badgeWrap: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  meta: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  name: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.ink,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  brand: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
  },
});
