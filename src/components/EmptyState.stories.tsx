import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "@/components/EmptyState";

const meta = {
  title: "Components/EmptyState",
  component: EmptyState,
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Nenhuma peça ainda",
    subtitle: "Adicione peças ao closet para montar looks.",
  },
};

export const WithCta: Story = {
  args: {
    title: "Nenhum look salvo",
    subtitle: "Salve looks do planejador ou do stylist.",
    cta: "Ver planejador",
    onPress: () => undefined,
  },
};
