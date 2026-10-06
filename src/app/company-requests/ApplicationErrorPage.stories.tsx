import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import ApplicationErrorPage from "./error";

const meta = {
  title: "CompanyApplications/ApplicationErrorPage",
  component: ApplicationErrorPage,
  args: { unstable_retry: fn() },
} satisfies Meta<typeof ApplicationErrorPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
