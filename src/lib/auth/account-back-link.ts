import type { AccountType } from "@/server/auth";

/** パスワード・パスキーの画面から戻る先。一般会員は登録情報へ戻す。 */
export function accountBackLink(accountType: AccountType | null) {
  if (accountType === "admin") return { href: "/admin", label: "アカウント画面に戻る" };
  if (accountType === "seller") return { href: "/dashboard", label: "アカウント画面に戻る" };
  return { href: "/account", label: "登録情報に戻る" };
}
