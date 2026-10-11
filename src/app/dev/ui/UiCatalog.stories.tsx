import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { UiCatalog } from "./UiCatalog";
const meta = {
  title: "App/Dev/UiCatalog",
  component: UiCatalog,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof UiCatalog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
