import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DesktopAccountMenu } from "./DesktopAccountMenu";

const meta = {
  title: "Components/DesktopAccountMenu",
  component: DesktopAccountMenu,
  args: { myPageCurrent: false },
  parameters: { layout: "centered" },
} satisfies Meta<typeof DesktopAccountMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const MyPage: Story = { args: { myPageCurrent: true } };
