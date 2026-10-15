import { getSessionUser } from "@/server/auth";

import { AppBar, type AppBarAccount, type AppBarProps } from "./AppBar";
import { ViewerAvatar } from "./ViewerAvatar";

/** 閲覧者のセッションから、PCヘッダーのアカウント欄を決める。 */
export async function getViewerAccount(): Promise<AppBarAccount> {
  const session = await getSessionUser();
  if (session === null) return { kind: "guest" };
  return { kind: "member", avatar: <ViewerAvatar session={session} /> };
}

/**
 * 閲覧者に応じたアカウント欄（未ログインはログインと新規登録、会員は本人の画像）を出す AppBar。画面から使う。
 * error.tsx のようなクライアント部品には、サーバー側の取得を持ち込めないので AppBar を使う。
 */
export async function SiteAppBar(props: AppBarProps) {
  return <AppBar {...props} account={await getViewerAccount()} />;
}
