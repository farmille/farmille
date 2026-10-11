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

export const Default: Story = {};

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

export const AffiliationPicked: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox", { name: "所属" });
    await userEvent.type(input, "JA");
    await userEvent.click(await page(canvasElement).findByRole("option", { name: "JA青年部" }));
    await expect(canvas.getByRole("button", { name: "JA青年部を削除" })).toBeVisible();
    await expect(input).toHaveValue("");
  },
};

export const AffiliationSuggestions: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.type(within(canvasElement).getByRole("combobox", { name: "所属" }), "JA");
    await waitFor(() =>
      expect(page(canvasElement).getByRole("option", { name: "JA青年部" })).toBeVisible(),
    );
  },
};

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
