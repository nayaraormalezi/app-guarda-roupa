import type { Meta, StoryObj } from "@storybook/react";
import { View } from "react-native";
import { PieceCard } from "@/components/PieceCard";
import { SEED_WARDROBE } from "@/data/seed-wardrobe";
import type { ClothingItem } from "@/data/types";

const sample = SEED_WARDROBE[0];
const shortItem: ClothingItem = { ...SEED_WARDROBE[2], tall: false };

const meta = {
  title: "Components/PieceCard",
  component: PieceCard,
  decorators: [
    (Story) => (
      <View style={{ width: 168 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof PieceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tall: Story = {
  args: {
    item: sample,
    onPress: () => undefined,
  },
};

export const Regular: Story = {
  args: {
    item: shortItem,
    onPress: () => undefined,
  },
};

export const Washing: Story = {
  args: {
    item: { ...sample, status: "washing", name: "Camisa em lavagem" },
    onPress: () => undefined,
  },
};
