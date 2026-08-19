import { fn } from "storybook/test";

type Actions = typeof import("../actions");

const saved = {
  status: "success",
  message: "Storybook 上で記事を保存しました。",
  articleId: "00000000-0000-4000-8000-000000000001",
  published: false,
} as const;

export const createArticleAction = fn<Actions["createArticleAction"]>(async () => saved);
export const updateArticleAction = fn<Actions["updateArticleAction"]>(async () => saved);
export const setArticleStatusAction = fn<Actions["setArticleStatusAction"]>(async () => saved);
export const deleteArticleAction = fn<Actions["deleteArticleAction"]>(async () => undefined);
export const searchMaterialsAction = fn<Actions["searchMaterialsAction"]>(async () => ({
  ok: true,
  items: [
    {
      id: "00000000-0000-4000-8000-000000000101",
      name: "土づくり微生物資材",
      manufacturer_name: "グリーンバイオ株式会社",
    },
  ],
}));
