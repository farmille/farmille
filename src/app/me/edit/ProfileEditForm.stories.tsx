import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ownProfile } from "../_components/story-fixtures";
import { ProfileEditForm } from "./ProfileEditForm";

const meta = {
  title: "App/Me/ProfileEditForm",
  component: ProfileEditForm,
  args: {
    profile: ownProfile,
    details: {
      standpoint: "farmer",
      prefecture_code: 8,
      bio: "",
      affiliations: [],
      crops: [],
      links: [],
    },
    options: {
      crops: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          name: "いちご",
          aliases: ["苺"],
          crop_groups: { name: "その他" },
        },
      ],
      affiliations: ["JA青年部"],
    },
  },
} satisfies Meta<typeof ProfileEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
