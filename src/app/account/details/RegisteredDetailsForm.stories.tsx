import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RegisteredDetailsForm } from "./RegisteredDetailsForm";

const meta = {
  title: "Pages/account/details/RegisteredDetailsForm",
  component: RegisteredDetailsForm,
  args: {
    details: {
      email: "farmer@example.test",
      familyName: "山田",
      givenName: "花子",
      phone: "09012345678",
      postalCode: "3100011",
      prefectureCode: 8,
      cityStreet: "水戸市三の丸1-2-3",
      buildingName: "",
    },
  },
} satisfies Meta<typeof RegisteredDetailsForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithoutContactDetails: Story = {
  args: {
    details: {
      email: "farmer@example.test",
      familyName: "",
      givenName: "",
      phone: "",
      postalCode: "",
      prefectureCode: null,
      cityStreet: "",
      buildingName: "",
    },
  },
};
