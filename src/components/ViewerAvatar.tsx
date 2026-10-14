import { Icon } from "@/components/Icon";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { getSessionUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { getOwnProfile } from "@/server/queries/profiles";

import { Avatar } from "./Avatar";

/**
 * アカウントボタンに出す、本人が設定した画像。
 * 画像が無い人と、表示情報を持たないアカウント（メーカー・運営）は人型アイコンのまま。
 */
export async function ViewerAvatar() {
  const session = await getSessionUser();
  if (session === null || !canUseGeneralFeatures(session.accountType)) {
    return <Icon name="person" size="md" />;
  }

  const profile = await getOwnProfile(session.userId);
  if (!profile.ok) {
    if (profile.error === "not_found") return <Icon name="person" size="md" />;
    throw new Error(errorMessageJa[profile.error]);
  }

  const { handle, avatarUrl } = profile.data;
  return avatarUrl === null ? (
    <Icon name="person" size="md" />
  ) : (
    <Avatar name={handle} src={avatarUrl} size="md" />
  );
}
