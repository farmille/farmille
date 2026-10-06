import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import RemovalEntryPage from "./page";

const meta = {
  title: "CompanyApplications/RemovalEntryPage",
  component: RemovalEntryPage,
} satisfies Meta<typeof RemovalEntryPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
