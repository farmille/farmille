import type { Meta, StoryObj } from "@storybook/nextjs-vite";

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
