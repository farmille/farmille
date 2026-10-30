import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { css } from "../../styled-system/css";
import { Icon, iconNames, type IconProps } from "./Icon";

const meta = {
  title: "Components/Display/Icon",
  component: Icon,
  args: { name: "star_filled" },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const sizes: IconProps["size"][] = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl"];

export const Sizes: Story = {
  render: (args) => (
    <div className={css({ display: "flex", flexWrap: "wrap", gap: "4", alignItems: "center" })}>
      {sizes.map((size) => (
        <div key={size} className={css({ display: "grid", justifyItems: "center", gap: "2" })}>
          <Icon {...args} size={size} />
          <span>{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const WithLabel: Story = { args: { name: "verified", label: "公式メーカー" } };

export const AllGlyphs: Story = {
  render: (args) => (
    <div className={css({ display: "flex", flexWrap: "wrap", gap: "4" })}>
      {iconNames.map((name) => (
        <div key={name} className={css({ display: "grid", justifyItems: "center", gap: "1" })}>
          <Icon {...args} name={name} size="lg" />
          <span className={css({ textStyle: "note" })}>{name}</span>
        </div>
      ))}
    </div>
  ),
};
