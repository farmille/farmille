"use client";

import { useActionState } from "react";

import type { HelpfulState } from "@/server/actions/helpful";
import { ThumbIcon } from "./icons";
import { helpfulPillRecipe } from "./helpful-pill";

type HelpfulAction = (previous: HelpfulState, formData: FormData) => Promise<HelpfulState>;

type HelpfulButtonProps = {
  action: HelpfulAction;
  voted: boolean;
  count: number;
  layout?: "card" | "detail";
};

/** 「参考になった」の押下ボタン。押下状態と件数は action の戻り値で更新する。 */
export function HelpfulButton({ action, voted, count, layout = "detail" }: HelpfulButtonProps) {
  const [state, formAction] = useActionState(action, { voted, count });

  return (
    <form action={formAction}>
      <button
        type="submit"
        aria-pressed={state.voted}
        className={helpfulPillRecipe({ layout, interactive: true, voted: state.voted })}
      >
        <ThumbIcon />
        <span>参考になった</span>
        {state.count}
      </button>
    </form>
  );
}
