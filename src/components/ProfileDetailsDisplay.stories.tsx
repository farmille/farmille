import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileDetailsDisplay } from "./ProfileDetailsDisplay";
const meta = {
  title: "Components/ProfileDetailsDisplay",
  component: ProfileDetailsDisplay,
  args: {
    details: {
      standpoint: "farmer",
      prefecture_code: 8,
      bio: "季節の野菜を育てています。",
      city: null,
      cityPublic: false,
      affiliations: ["地域の野菜研究会"],
      crops: [{ id: "10000000-0000-4000-8000-000000000001", name: "いちご", aliases: ["苺"] }],
      links: ["https://example.com/farm"],
    },
    editable: true,
  },
} satisfies Meta<typeof ProfileDetailsDisplay>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
