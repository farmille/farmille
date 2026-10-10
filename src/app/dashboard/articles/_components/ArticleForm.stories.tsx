import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { ArticleForm } from "./ArticleForm";

const meta = {
  title: "App/Dashboard/Articles/ArticleForm",
  component: ArticleForm,
  args: {
    sellerId: "00000000-0000-4000-8000-000000000201",
    mode: "edit",
    articleId: "00000000-0000-4000-8000-000000000601",
    initialTitle: "高温期のトマト栽培で微生物資材を使うポイント",
    initialBody:
      "## 使用した時期\n\n定植2週間前に土壌へ混和しました。\n\n## 観察したこと\n\n初期の根張りがそろいました。",
    initialStatus: "draft",
    initialMaterials: [
      {
        id: "00000000-0000-4000-8000-000000000101",
        name: "土づくり微生物資材",
        manufacturer_name: "グリーンバイオ株式会社",
      },
    ],
  },
  parameters: {
    nextjs: { navigation: { pathname: "/dashboard/articles/storybook/edit" } },
  },
} satisfies Meta<typeof ArticleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditDraft: Story = {};

export const Create: Story = {
  args: {
    mode: "create",
    articleId: undefined,
    initialTitle: "",
    initialBody: "",
    initialMaterials: [],
  },
};

/** 検索ボタンで探した資材が一覧に出て、選ぶと紐づけ資材のチップになる。 */
export const MaterialSearch: Story = {
  args: Create.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.type(canvas.getByRole("combobox", { name: "資材を検索して追加" }), "土づくり");
    await userEvent.click(canvas.getByRole("button", { name: "検索" }));
    await userEvent.click(
      await page.findByRole("option", { name: "土づくり微生物資材 グリーンバイオ株式会社" }),
    );
    await expect(
      canvas.getByRole("button", { name: "土づくり微生物資材を外す" }),
    ).toBeInTheDocument();
  },
};
