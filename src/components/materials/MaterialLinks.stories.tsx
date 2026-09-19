import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MaterialLinks } from "./MaterialLinks";
const meta = {
  title: "Components/Materials/Links",
  component: MaterialLinks,
  args: { links: [] },
} satisfies Meta<typeof MaterialLinks>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Duplicate: Story = {
  args: {
    links: [
      { group: "overview", title: "製品資料", url: "https://example.com/product.pdf" },
      { group: "technical", title: "試験結果", url: "https://example.com/product.pdf" },
    ],
  },
};
