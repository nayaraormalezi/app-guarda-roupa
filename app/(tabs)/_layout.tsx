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
      <Plus size={22} color={colors.onInk} strokeWidth={2.2} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomGap = Math.max(insets.bottom, 10);
  const { colors } = useTheme();

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.tabBar,
      borderTopWidth: 0,
      height: 68,
      paddingTop: 0,
      paddingBottom: 0,
      marginHorizontal: 16,
      marginBottom: bottomGap,
      borderRadius: 22,
      overflow: "visible" as const,
      shadowColor: colors.ink,
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    }),
    [colors, bottomGap]
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.soft,
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: 9,
          marginBottom: 2,
        },
        tabBarStyle,
        tabBarItemStyle: {
          paddingHorizontal: 4,
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
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="closet"
        options={{
          title: "Closet",
          tabBarIcon: ({ color }) => <Grid3X3 size={20} color={color} />,
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
            height: 68,
          },
        }}
      />
      <Tabs.Screen
        name="stylist"
        options={{
          title: "Stylist",
          tabBarIcon: ({ color }) => <Sparkles size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Mais",
          tabBarIcon: ({ color }) => <MoreHorizontal size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
});
