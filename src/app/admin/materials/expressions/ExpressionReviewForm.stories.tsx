import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ExpressionReviewForm } from "./ExpressionReviewForm";
const meta = {
  title: "Admin/ExpressionReview",
  component: ExpressionReviewForm,
  parameters: { nextjs: { appDirectory: true } },
  args: { versionId: "11111111-1111-4111-8111-111111111111" },
} satisfies Meta<typeof ExpressionReviewForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
