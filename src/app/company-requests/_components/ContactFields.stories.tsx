import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContactFields } from "./ContactFields";
import { emptyContact } from "./ContactFields";
const meta = {
  title: "CompanyApplications/ContactFields",
  component: ContactFields,
  parameters: { nextjs: { appDirectory: true } },
  args: { defaults: emptyContact },
} satisfies Meta<typeof ContactFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
