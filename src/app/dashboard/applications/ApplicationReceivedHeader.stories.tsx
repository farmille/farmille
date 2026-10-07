import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ApplicationReceivedHeader } from "./ApplicationReceivedHeader";

const meta = {
  title: "Dashboard/ApplicationReceivedHeader",
  component: ApplicationReceivedHeader,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: { title: "資材掲載・資材オーナー権限申請フォーム" },
} satisfies Meta<typeof ApplicationReceivedHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const UnknownKind: Story = { args: { title: null } };
