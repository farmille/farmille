import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostalAddressFields } from "./PostalAddressFields";
const meta = {
  title: "App/Auth/PostalAddressFields",
  component: PostalAddressFields,
  args: {
    values: { postalCode: "1000001", prefectureCode: "13", city: "千代田区" },
    fieldErrors: {},
  },
} satisfies Meta<typeof PostalAddressFields>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
