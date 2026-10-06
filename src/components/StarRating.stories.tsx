import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { StarRating } from "./StarRating";

const meta = {
  title: "Components/StarRating",
  component: StarRating,
} satisfies Meta<typeof StarRating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Zero: Story = {
  args: {
    mode: "display",
    value: 0,
  },
};

export const Mid: Story = {
  args: {
    mode: "display",
    value: 2.5,
  },
};

export const HighFraction: Story = {
  args: {
    mode: "display",
    value: 3.5,
  },
};

export const Full: Story = {
  args: {
    mode: "display",
    value: 5,
  },
};

export const Large: Story = {
  args: {
    mode: "display",
    value: 4,
    size: "lg",
  },
};

export const Small: Story = {
  args: {
    mode: "display",
    value: 4,
    size: "sm",
  },
};

export const WithValue: Story = {
  args: {
    mode: "display",
    value: 5,
    showValue: true,
  },
};

export const WithValueLarge: Story = {
  args: {
    mode: "display",
    value: 4,
    size: "lg",
    showValue: true,
  },
};

export const Input: Story = {
  args: {
    mode: "input",
    value: 3,
    onChange: fn(),
  },
};

export const InputEmpty: Story = {
  args: {
    mode: "input",
    value: 0,
    onChange: fn(),
  },
};

export const InputFull: Story = {
  args: {
    mode: "input",
    value: 5,
    onChange: fn(),
  },
};

function RatingInput() {
  const [value, setValue] = useState(3);
  return <StarRating mode="input" value={value} onChange={setValue} />;
}
export const Interactive: Story = {
  args: { mode: "input", value: 3, onChange: fn() },
  render: () => <RatingInput />,
};
