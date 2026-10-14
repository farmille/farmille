import { AppBar, type AppBarProps } from "./AppBar";
import { ViewerAvatar } from "./ViewerAvatar";

/**
 * アカウントボタンに、本人が設定した画像を出す AppBar。画面から使う。
 * error.tsx のようなクライアント部品には、サーバー側の取得を持ち込めないので AppBar を使う。
 */
export function SiteAppBar(props: AppBarProps) {
  return <AppBar {...props} accountAvatar={<ViewerAvatar />} />;
}
