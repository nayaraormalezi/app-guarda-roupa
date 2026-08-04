import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Text, View } from "react-native";
import { fonts } from "@/theme/typography";

function Welcome() {
  return (
    <View style={{ gap: 12, maxWidth: 560 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 34, color: "#1C1917" }}>
        Personal Stylist
      </Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 15, color: "#8C8278", lineHeight: 22 }}>
        Design system do app — tokens e componentes. Use a toolbar Theme para Light/Dark.
        Navegue pelas seções Foundations e Components no menu.
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
