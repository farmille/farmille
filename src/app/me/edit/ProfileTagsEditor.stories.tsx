import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ProfileTagsEditor } from "./ProfileTagsEditor";
const meta = {
  title: "App/Me/ProfileTagsEditor",
  component: ProfileTagsEditor,
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

const page = (canvasElement: HTMLElement) => within(canvasElement.ownerDocument.body);

/** 選んだ作目は入力欄の中のチップ、一覧にない所属は「その他」のチップで示す。 */
export const Default: Story = {};

/** 作物名や別名で探す。選んだ作目は候補に出さない。 */
export const CropSearch: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox", { name: "主な作目" }), "トマ");
    await waitFor(() =>
      expect(
        page(canvasElement).getByRole("option", { name: "トマト なす科果菜類" }),
      ).toBeVisible(),
    );
  },
};

/** 一覧の所属は押して選ぶ。 */
export const AffiliationPicked: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "JA青年部" }));
    await expect(canvas.getByRole("button", { name: "JA青年部" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

/** 一覧の所属は入力欄の候補からも選べる。 */
export const AffiliationSuggestions: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox", { name: "所属" }), "JA");
    await waitFor(() =>
      expect(page(canvasElement).getByRole("option", { name: "JA青年部" })).toBeVisible(),
    );
  },
};

/** 作目50件・所属20件に達すると、作目の入力欄は読み取り専用、所属の入力と未選択の候補は押せない。 */
export const AtLimits: Story = {
  args: {
    details: {
      ...meta.args.details,
      crops: Array.from({ length: 50 }, (_, i) => ({
        id: `crop-${i}`,
        name: `作目${i}`,
        aliases: [],
      })),
      affiliations: Array.from({ length: 20 }, (_, i) => `所属${i}`),
    },
  },
};
