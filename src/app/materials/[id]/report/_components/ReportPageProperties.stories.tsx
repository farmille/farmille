import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { ReportPageProperties } from "./ReportPageProperties";
import { filledReport } from "./reportStoryFixture";

const meta = {
  title: "Pages/materials/[id]/report/ReportPageProperties",
  component: ReportPageProperties,
  args: {
    input: filledReport,
    onChange: fn(),
    missing: new Set<string>(),
    material: { id: filledReport.materialId, name: "スキーポン", manufacturerName: "ファーム技研" },
    pageMaterialId: filledReport.materialId,
    onMaterialChange: fn(),
    crops: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "トマト",
        aliases: [],
        groupName: "果菜類",
      },
    ],
    favoriteCropIds: [],
    materialCropIds: [],
    effects: [
      { id: "e1", name: "収量向上", categoryName: "収量・品質の改善" },
      { id: "e2", name: "品質向上", categoryName: "収量・品質の改善" },
    ],
    materialEffectNames: [],
    authorName: "しおさい農園",
    onMessage: fn(),
  },
} satisfies Meta<typeof ReportPageProperties>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Filled: Story = {};

export const Missing: Story = {
  args: {
    input: { ...filledReport, cropId: null, purposeTags: [], timingStages: [] },
    missing: new Set(["cropId", "purposeTags", "timingStages"]),
  },
};

export const CropSelection: Story = {
  args: {
    crops: [
      ...meta.args.crops,
      {
        id: "22222222-2222-4222-8222-222222222223",
        name: "キュウリ",
        aliases: [],
        groupName: "果菜類",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "作物：トマト" }));
    const picker = within(page.getByRole("dialog", { name: "作物を選ぶ" }));
    await expect(picker.getAllByRole("button", { name: "トマト", pressed: true })).not.toHaveLength(
      0,
    );
    await expect(
      picker.getAllByRole("button", { name: "キュウリ", pressed: false }),
    ).not.toHaveLength(0);
  },
};

export const MaterialSelection: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "資材：スキーポン" }));
    const picker = within(page.getByRole("dialog", { name: "資材を選ぶ" }));
    await expect(
      picker.getByRole("button", { name: "スキーポン ファーム技研", pressed: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await userEvent.type(picker.getByRole("searchbox", { name: "資材を検索" }), "根圏");
    await expect(
      await picker.findByRole("button", { name: "根圏サポートA ファーム技研", pressed: false }),
    ).toHaveAttribute("aria-pressed", "false");
  },
};

export const SelectedSearchMaterial: Story = {
  args: {
    input: { ...filledReport, materialId: "00000000-0000-4000-8000-000000000102" },
    pageMaterialId: "00000000-0000-4000-8000-000000000102",
    material: {
      id: "00000000-0000-4000-8000-000000000102",
      name: "根圏サポートA",
      manufacturerName: "ファーム技研",
    },
  },
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(page.getByRole("button", { name: "資材：根圏サポートA" }));
    const picker = within(page.getByRole("dialog", { name: "資材を選ぶ" }));
    await userEvent.type(picker.getByRole("searchbox", { name: "資材を検索" }), "根圏");
    await expect(
      await picker.findByRole("button", { name: "根圏サポートA ファーム技研", pressed: true }),
    ).toHaveAttribute("aria-pressed", "true");
  },
};
