import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MaterialRegistrationBadges } from "./MaterialRegistrationBadges";

const meta = {
  title: "Pages/Shared/MaterialRegistrationBadges",
  component: MaterialRegistrationBadges,
  args: {
    registrations: [
      { kind: "pesticide", companyName: "農薬登録会社", effects: "表示に従って使用" },
      { kind: "fertilizer", companyName: "肥料事業者", effects: "" },
      { kind: "soil_amendment", companyName: "表示会社", effects: "" },
    ],
    certifications: ["有機JAS適合資材"],
  },
} satisfies Meta<typeof MaterialRegistrationBadges>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Empty: Story = { args: { registrations: [], certifications: [] } };
