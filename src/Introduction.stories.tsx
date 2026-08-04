import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Text, View } from "react-native";
import { fonts } from "@/theme/typography";

function Welcome() {
  return (
    <View style={{ gap: 16, maxWidth: 560 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 40, color: "#121212" }}>
        Vestia
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 16, color: "#8E8A83", lineHeight: 24 }}>
        Design system da assistente de Personal Stylist. Playfair + Inter. Use Theme na toolbar
        para Light/Dark. Navegue Foundations e Components.
      </Text>
    </View>
  );
}

const meta = {
  title: "Introduction",
  component: Welcome,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Welcome>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WelcomeStory: Story = {
  name: "Welcome",
};
