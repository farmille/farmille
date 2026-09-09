"use client";

import { useState } from "react";

import { Button } from "@/components/Button";
import { FormMessage, formActionsStyle } from "@/components/auth/Fields";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import { passkeyErrorMessage } from "@/lib/auth/passkey-error";
import { errorMessageJa } from "@/server/errors";
import { safeNextPath } from "@/lib/auth/safe-next";

/** メールアドレスを入力せず、端末に保存したアカウントを選んでログインする。 */
export function PasskeyLogin({ next }: { next: string | null }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function signIn() {
    setPending(true);
    setMessage(null);
    try {
      const { error } = await createAuthBrowserClient().auth.signInWithPasskey();
      if (error) {
        setMessage(passkeyErrorMessage(error));
        return;
      }
      // Cookie の更新後にサーバー側でアカウントと遷移先の権限を判定する。
      window.location.assign(safeNextPath(next) ?? "/");
    } catch {
      setMessage(errorMessageJa.passkey_unavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={formActionsStyle}>
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}
      <Button variant="ghost" disabled={pending} onClick={signIn}>
        {pending ? "端末で認証してください…" : "パスキーでログイン"}
      </Button>
    </div>
  );
}
