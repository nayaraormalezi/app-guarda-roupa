import React from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router";
import { Grid3X3, Home, MoreHorizontal, Plus, Sparkles } from "lucide-react-native";
import { colors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

function FabIcon() {
  return (
    <View style={styles.fab}>
      <Plus size={22} color={colors.white} strokeWidth={2.2} />
    </View>
  );
}

export default function TabLayout() {
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
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.96)",
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
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
          tabBarIcon: () => <FabIcon />,
          tabBarLabel: () => null,
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
    marginTop: -18,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ink,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
