import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MaterialAuditForm } from "./MaterialAuditForm";
const meta = {
  title: "Pages/admin/materials/[id]/MaterialAuditForm",
  component: MaterialAuditForm,
  parameters: { nextjs: { appDirectory: true } },
  args: { materialId: "11111111-1111-4111-8111-111111111111" },
} satisfies Meta<typeof MaterialAuditForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
