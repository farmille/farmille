import { Icon } from "@/components/Icon";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { getSessionUser } from "@/server/auth";
import { errorMessageJa } from "@/server/errors";
import { getOwnProfile } from "@/server/queries/profiles";

import { Avatar } from "./Avatar";

/**
 * アカウントボタンに出す、本人のアバター。設定した画像があればその画像、無ければ他の画面と同じ Humation のイラスト。
 * 未ログインと、表示情報を持たないアカウント（メーカー）は人型アイコンのまま。
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
  return <Avatar name={handle} src={avatarUrl} size="md" />;
}
