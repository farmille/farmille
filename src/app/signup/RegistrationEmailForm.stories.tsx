import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RegistrationEmailForm } from "./RegistrationEmailForm";
const meta = {
  title: "App/Auth/RegistrationEmailForm",
  component: RegistrationEmailForm,
} satisfies Meta<typeof RegistrationEmailForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
