import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CatalogSidebar } from "./CatalogSidebar";
const meta = {
  title: "App/Search/CatalogSidebar",
  component: CatalogSidebar,
  args: {
    catalog: { materials: [], crops: [], groups: [], counts: [] },
    search: {
      filters: [{ category: "effect", id: "growth", name: "生育促進", aliases: [], sort_order: 1 }],
      makers: ["農業資材株式会社"],
      materialNames: [],
    },
    selected: [],
    sort: "newest",
    query: "",
  },
} satisfies Meta<typeof CatalogSidebar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
