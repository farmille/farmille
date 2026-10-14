import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@/components/form/Input";
import { Textarea } from "@/components/form/Textarea";
import { css } from "../../../../styled-system/css";

import {
  AspectRatioTokens,
  ColorTokens,
  ElevationTokens,
  RadiusTokens,
  SemanticColorTokens,
  SizeTokens,
  SpacingTokens,
  TokenCatalog,
  TypographyTokens,
} from "./TokenCatalog";

const meta = {
  title: "Tokens",
  component: TokenCatalog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TokenCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Catalog: Story = {};

export const Colors: Story = {
  render: () => <ColorTokens />,
};

export const SemanticColors: Story = {
  render: () => <SemanticColorTokens />,
};

export const Typography: Story = {
  render: () => <TypographyTokens />,
};

export const Spacing: Story = {
  render: () => <SpacingTokens />,
};

export const Radius: Story = {
  render: () => <RadiusTokens />,
};

export const Elevation: Story = {
  render: () => <ElevationTokens />,
};

export const Sizes: Story = {
  render: () => <SizeTokens />,
};

export const AspectRatios: Story = {
  render: () => <AspectRatioTokens />,
};

export const MixedScriptSpacing: Story = {
  render: () => (
    <section className={css({ p: "6", display: "grid", gap: "6", textStyle: "body" })}>
      <h1>Farmille 資材レビュー 2026</h1>
      <p>ABC xyz 0123456789</p>
      <p>夏の高温期に使った資材を記録する。</p>
      <p>トマトにABC資材を10kg使用。2026年の収量を比較する。</p>
      <p className={css({ fontVariantNumeric: "tabular-nums" })}>収量 12345kg ／ 67890kg</p>
      <label>
        資材名
        <Input aria-label="資材名" defaultValue="ABC資材2026" />
      </label>
      <label>
        使用メモ
        <Textarea aria-label="使用メモ" defaultValue="トマトにABC資材を10kg使用しました。" />
      </label>
    </section>
  ),
};
