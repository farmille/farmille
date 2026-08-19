"use server";

import { redirect } from "next/navigation";

import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import {
  isHelpfulTargetType,
  toggleHelpfulVote,
  type HelpfulTargetType,
} from "@/server/mutations/helpful";
import { getHelpfulCount } from "@/server/queries/helpful";

export type HelpfulState = {
  voted: boolean;
  count: number;
};

/**
 * 「参考になった」のトグル。未ログインはログイン誘導、自分の投稿は server 側で拒否する（T-34）。
 * 押下状態と件数は戻り値で返し、HelpfulButton がその値を描画する。
 */
export async function toggleHelpfulAction(
  targetType: HelpfulTargetType,
  targetId: string,
  currentPath: string,
  _previous: HelpfulState,
  _formData: FormData,
): Promise<HelpfulState> {
  if (!isHelpfulTargetType(targetType)) {
    throw new Error(errorMessageJa.invalid_body);
  }

  const session = await requireGeneralUser();

  if (!session.ok) {
    if (session.error === "unauthorized") {
      redirect(`/login?next=${encodeURIComponent(currentPath)}`);
    }
    throw new Error(errorMessageJa[session.error]);
  }

  const result = await toggleHelpfulVote(targetType, targetId, session.data.userId);

  if (!result.ok) {
    throw new Error(errorMessageJa[result.error]);
  }

  const count = await getHelpfulCount(targetType, targetId);

  if (!count.ok) {
    throw new Error(errorMessageJa[count.error]);
  }

  return { voted: result.data.voted, count: count.data };
}
