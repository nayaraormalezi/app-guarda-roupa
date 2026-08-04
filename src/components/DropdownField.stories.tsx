import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DropdownField } from "@/components/DropdownField";

function DropdownDemo({
  initial = "",
  placeholder,
}: {
  initial?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <DropdownField
      label="Ocasião"
      value={value}
      options={["Trabalho", "Faculdade", "Encontro", "Casa"]}
      onChange={setValue}
      placeholder={placeholder}
    />
  );
}

const meta = {
  title: "Components/DropdownField",
  component: DropdownDemo,
} satisfies Meta<typeof DropdownDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
  args: { initial: "Trabalho" },
};

export const Placeholder: Story = {
  args: { initial: "", placeholder: "Selecionar" },
};
