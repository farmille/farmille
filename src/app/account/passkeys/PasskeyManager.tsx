"use client";

import type { PasskeyMetadata } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormActions, Notice } from "@/components/form";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import { passkeyErrorMessage } from "@/lib/auth/passkey-error";
import { errorMessageJa } from "@/server/errors";

export function PasskeyManager({
  passkeys,
  admin,
}: {
  passkeys: PasskeyMetadata[];
  admin: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function change(passkeyId: string | null) {
    setPending(true);
    setMessage(null);
    setFailed(false);
    try {
      const auth = createAuthBrowserClient().auth;
      const { error } =
        passkeyId === null
          ? await auth.registerPasskey()
          : await auth.passkey.delete({ passkeyId });
      if (error) {
        setFailed(true);
        setMessage(passkeyErrorMessage(error));
        return;
      }
      setMessage(passkeyId === null ? "パスキーを登録しました。" : "パスキーを削除しました。");
      router.refresh();
    } catch {
      setFailed(true);
      setMessage(errorMessageJa.passkey_unavailable);
    } finally {
      setPending(false);
    }
  }

  return (
    <FormActions>
      {admin ? (
        <Notice tone="info">運営画面では、パスキーによるログイン後も2要素認証が必要です。</Notice>
      ) : null}
      {message ? <Notice tone={failed ? "error" : "success"}>{message}</Notice> : null}
      {passkeys.length === 0 ? <p>パスキーはまだ登録されていません。</p> : null}
      {passkeys.map((passkey) => (
        <div key={passkey.id}>
          <p>{passkey.friendly_name || "パスキー"}</p>
          <p>
            登録日：
            {new Date(passkey.created_at).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}
          </p>
          <ConfirmDialog
            confirmLabel="このパスキーを削除する"
            description="このパスキーではログインできなくなります。パスワードなど、別のログイン方法を確認してから削除してください。"
            onConfirm={() => change(passkey.id)}
            pendingLabel="削除中…"
            title="パスキーを削除しますか？"
            trigger={
              <Button disabled={pending} variant="ghost">
                削除
              </Button>
            }
          />
        </div>
      ))}
      <Button disabled={pending} onClick={() => change(null)}>
        {pending ? "処理中…" : "パスキーを登録する"}
      </Button>
      <p>
        パスワードでのログインも引き続き利用できます。端末のパスワード管理アプリに残ったパスキーは、必要に応じて端末側でも削除してください。
      </p>
    </FormActions>
  );
}
