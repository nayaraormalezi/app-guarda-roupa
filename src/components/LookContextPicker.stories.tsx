import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { LookContextPicker } from "@/components/LookContextPicker";
import type { FormalityId, OccasionId } from "@/data/types";

function PickerDemo() {
  const [occasionId, setOccasionId] = useState<OccasionId>("trabalho");
  const [formalityId, setFormalityId] = useState<FormalityId>("casual_arrumado");
  return (
    <LookContextPicker
      occasionId={occasionId}
      formalityId={formalityId}
      onOccasionChange={setOccasionId}
      onFormalityChange={setFormalityId}
    />
  );
}

const meta = {
  title: "Components/LookContextPicker",
  component: PickerDemo,
} satisfies Meta<typeof PickerDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
