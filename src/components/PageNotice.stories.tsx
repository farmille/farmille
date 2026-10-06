import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageNotice } from "./PageNotice";
import { Button } from "./Button";
const meta = {
  title: "Components/PageNotice",
  component: PageNotice,
  args: {
    title: "ページが見つかりません",
    description: "指定されたページは存在しないか、移動した可能性があります。",
    children: <Button variant="ghost">ホームへ戻る</Button>,
  },
} satisfies Meta<typeof PageNotice>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
