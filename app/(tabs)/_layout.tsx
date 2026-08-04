import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Grid3X3, Home, MoreHorizontal, Plus, Sparkles } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { fonts } from "@/theme/typography";
import type { ThemeColors } from "@/theme/colors";

function FabIcon({ colors }: { colors: ThemeColors }) {
  return (
    <View style={[styles.fab, { backgroundColor: colors.ink }]}>
      <Plus size={22} color={colors.onInk} strokeWidth={2} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const { colors } = useTheme();

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.tabBar,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      height: 64 + bottomPad,
      paddingTop: 8,
      paddingBottom: bottomPad,
      marginHorizontal: 0,
      marginBottom: 0,
      borderRadius: 0,
      elevation: 0,
      shadowOpacity: 0,
    }),
    [colors, bottomPad]
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 10,
          marginTop: 2,
        },
        tabBarStyle,
        tabBarItemStyle: {
          paddingHorizontal: 2,
          justifyContent: "center",
          alignItems: "center",
        },
        sceneStyle: {
          backgroundColor: colors.cream,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          title: "Guarda-roupa",
          tabBarIcon: ({ color }) => <Grid3X3 size={22} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: () => <FabIcon colors={colors} />,
          tabBarLabel: () => null,
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
          },
        }}
      />
      <Tabs.Screen
        name="stylist"
        options={{
          title: "Stylist",
          tabBarIcon: ({ color }) => <Sparkles size={22} color={color} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Mais",
          tabBarIcon: ({ color }) => <MoreHorizontal size={22} color={color} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
  },
});
