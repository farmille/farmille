import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HomeFooter } from "./HomeFooter";
const meta = { title: "App/Home/Footer", component: HomeFooter } satisfies Meta<typeof HomeFooter>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
