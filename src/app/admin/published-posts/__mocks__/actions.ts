import { fn } from "storybook/test";

type Actions = typeof import("../actions");

export const removePublishedPostAction = fn<Actions["removePublishedPostAction"]>(async () => ({
  status: "done",
  message: "公開から削除しました。投稿内容は運営の記録として保持されています。",
}));
