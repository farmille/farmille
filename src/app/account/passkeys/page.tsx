import type { Metadata } from "next";

import { PasskeyManager } from "@/app/account/passkeys/PasskeyManager";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { TextLink } from "@/components/TextLink";
import { NO_INDEX_ROBOTS } from "@/lib/seo";
import { getAccountPasskeys } from "@/server/accounts/passkeys";

export const metadata: Metadata = { title: "パスキーの管理", robots: NO_INDEX_ROBOTS };

export default async function PasskeysPage() {
  const { passkeys, accountType } = await getAccountPasskeys();
  const back = accountType === "admin" ? "/admin" : accountType === "seller" ? "/dashboard" : "/me";

  return (
    <AuthScreen
      title="パスキーの管理"
      lead="指紋・顔認証や端末のPINでログインできます。ご自身が管理する端末に登録してください。"
    >
      <PasskeyManager passkeys={passkeys} admin={accountType === "admin"} />
      <TextLink href={back} variant="plain">
        アカウント画面に戻る
      </TextLink>
    </AuthScreen>
  );
}
