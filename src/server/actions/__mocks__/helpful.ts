import { fn } from "storybook/test";

import type { HelpfulState } from "@/server/actions/helpful";

// Storybook 専用モック。押下ごとにトグルした状態を返し、実サーバー無しで
// HelpfulButton の押下・解除の見た目を確認できるようにする。
export const toggleHelpfulAction = fn(
  async (
    _targetType: string,
    _targetId: string,
    _currentPath: string,
    previous: HelpfulState,
    _formData: FormData,
  ): Promise<HelpfulState> =>
    previous.voted
      ? { voted: false, count: previous.count - 1 }
      : { voted: true, count: previous.count + 1 },
).mockName("toggleHelpfulAction");
