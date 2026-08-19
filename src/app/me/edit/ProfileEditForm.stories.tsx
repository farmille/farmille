import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import type { CropOption } from "@/server/queries/crops";
import { ownProfile } from "../_components/story-fixtures";
import { ProfileEditForm } from "./ProfileEditForm";

const crops = [
  { id: "crop-tomato", name: "トマト", group_id: "fruit", sort_order: 10 },
  { id: "crop-cucumber", name: "きゅうり", group_id: "fruit", sort_order: 20 },
  { id: "crop-spinach", name: "ほうれん草", group_id: "leaf", sort_order: 30 },
  { id: "crop-cabbage", name: "キャベツ", group_id: "leaf", sort_order: 40 },
] satisfies CropOption[];

const meta = {
  title: "App/Me/ProfileEditForm",
  component: ProfileEditForm,
  args: { profile: ownProfile, crops },
} satisfies Meta<typeof ProfileEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
