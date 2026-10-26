import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SiteFooter } from "./SiteFooter";
const meta = { title: "Pages/Shared/SiteFooter", component: SiteFooter } satisfies Meta<
  typeof SiteFooter
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
