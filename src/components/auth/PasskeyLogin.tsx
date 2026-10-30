"use client";

import { useId, useReducer } from "react";

import { Button } from "@/components/Button";
import { FormActions, Notice } from "@/components/form";
import { createAuthBrowserClient } from "@/lib/auth/browser";
import { passkeyErrorMessage } from "@/lib/auth/passkey-error";
import { errorMessageJa } from "@/server/errors";
import { safeNextPath } from "@/lib/auth/safe-next";
import { css } from "../../../styled-system/css";

const descriptionStyle = css({
  textStyle: "supporting",
  color: "text.subtle",
  textAlign: "center",
});

/** メールアドレスを入力せず、端末に保存したアカウントを選んでログインする。 */
export function PasskeyLogin({
  next,
  description,
}: {
  next: string | null;
  /** ボタンの下に添える、パスキーとは何かと登録の場所の説明。 */
  description?: string;
}) {
  const [pending, setPending] = useReducer((_current: boolean, next: boolean) => next, false);

  const [message, setMessage] = useReducer(
    (_current: string | null, next: string | null) => next,
    null,
  );

  const descriptionId = useId();

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
    <FormActions>
      {message ? <Notice tone="error">{message}</Notice> : null}
      <Button
        aria-describedby={description === undefined ? undefined : descriptionId}
        variant="ghost"
        disabled={pending}
        onClick={signIn}
      >
        {pending ? "端末で認証してください…" : "パスキーでログイン"}
      </Button>
      {description === undefined ? null : (
        <p className={descriptionStyle} id={descriptionId}>
          {description}
        </p>
      )}
    </FormActions>
  );
}
