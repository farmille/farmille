import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { css } from "../../styled-system/css";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./Collapsible";

const meta = {
  title: "Components/Display/Collapsible",
  component: Collapsible,
  args: { children: null },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

const usage = (
  <div
    className={css({
      mt: "1.5",
      px: "3",
      py: "2",
      bg: "surface.page",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "border.default",
      borderRadius: "input",
      fontSize: "sm",
      lineHeight: "prose",
    })}
  >
    灌注：定植後7日目から1,000倍で週1回。生育初期は2,000倍に薄めて使う。
  </div>
);

export const Section: Story = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger>作物</CollapsibleTrigger>
      <CollapsiblePanel>{usage}</CollapsiblePanel>
    </Collapsible>
  ),
};

export const SectionOpen: Story = {
  render: () => (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>作物</CollapsibleTrigger>
      <CollapsiblePanel>{usage}</CollapsiblePanel>
    </Collapsible>
  ),
};

export const Link: Story = {
  render: () => (
    <Collapsible>
      <CollapsibleTrigger variant="link">詳細を見る</CollapsibleTrigger>
      <CollapsiblePanel hiddenUntilFound>{usage}</CollapsiblePanel>
    </Collapsible>
  ),
};

export const LinkOpen: Story = {
  render: () => (
    <Collapsible defaultOpen>
      <CollapsibleTrigger variant="link">詳細を見る</CollapsibleTrigger>
      <CollapsiblePanel>{usage}</CollapsiblePanel>
    </Collapsible>
  ),
};
