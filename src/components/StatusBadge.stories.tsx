import type { Meta, StoryObj } from "@storybook/react";
import { StatusBadge } from "@/components/StatusBadge";

const meta = {
  title: "Components/StatusBadge",
  component: StatusBadge,
  argTypes: {
    status: {
      control: { type: "select" },
      options: ["available", "washing", "borrowed"],
    },
  },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {
  args: { status: "available" },
};

export const Washing: Story = {
  args: { status: "washing" },
};

export const Borrowed: Story = {
  args: { status: "borrowed" },
};
