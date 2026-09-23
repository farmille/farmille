import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { VerificationForm } from "./VerificationForm";
const meta = {
  title: "CompanyApplications/VerificationForm",
  component: VerificationForm,
  parameters: { nextjs: { appDirectory: true } },
  args: {},
} satisfies Meta<typeof VerificationForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
