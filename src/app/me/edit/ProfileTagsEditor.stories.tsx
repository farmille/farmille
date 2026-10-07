import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProfileTagsEditor } from "./ProfileTagsEditor";
const meta = {
  title: "App/Me/ProfileTagsEditor",
  component: ProfileTagsEditor,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
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
    options: {
      crops: [
        {
          id: "10000000-0000-4000-8000-000000000001",
          name: "いちご",
          aliases: ["苺"],
          crop_groups: { name: "野菜類" },
        },
        {
          id: "10000000-0000-4000-8000-000000000002",
          name: "トマト",
          aliases: ["大玉トマト"],
          crop_groups: { name: "なす科果菜類" },
        },
        {
          id: "10000000-0000-4000-8000-000000000003",
          name: "きゅうり",
          aliases: [],
          crop_groups: { name: "うり類" },
        },
      ],
      affiliations: ["JA青年部"],
    },
  },
} satisfies Meta<typeof ProfileTagsEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
