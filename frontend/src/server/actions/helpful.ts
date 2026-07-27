"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireGeneralUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import {
  isHelpfulTargetType,
  toggleHelpfulVote,
  type HelpfulTargetType,
} from "@/server/mutations/helpful";

/**
 * 「参考になった」のトグル。未ログインはログイン誘導、自分の投稿は server 側で拒否する（T-34）。
 * カードは `<form action={toggleHelpfulAction.bind(null, targetType, targetId, currentPath)}>` で使う。
 */
export async function toggleHelpfulAction(
  targetType: HelpfulTargetType,
  targetId: string,
  currentPath: string,
  _formData: FormData,
): Promise<void> {
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

  revalidatePath(currentPath);
}
