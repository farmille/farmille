import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConsentFields } from "./ConsentFields";
const meta = {
  title: "CompanyApplications/ConsentFields",
  component: ConsentFields,
  parameters: { nextjs: { appDirectory: true } },
  args: { kind: "registration", startNumber: 3 },
} satisfies Meta<typeof ConsentFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
