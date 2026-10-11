import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RegistrationTerms } from "./RegistrationTerms";
const meta = { title: "App/Auth/RegistrationTerms", component: RegistrationTerms } satisfies Meta<
  typeof RegistrationTerms
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
