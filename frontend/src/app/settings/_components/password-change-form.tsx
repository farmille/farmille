"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { changePassword } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// アカウント設定のパスワード変更フォーム (2026-06-13)。
// changePassword サーバーアクション: 現在のパスワードで再認証してから更新する。
// ログイン中セッションで実行されるため SMTP 不要。変更後もログインは維持される。

export function PasswordChangeForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setFieldError(null);

    const current = formData.get("current_password");
    const password = formData.get("password");
    const confirm = formData.get("password_confirm");

    if (typeof current !== "string" || current.length === 0) {
      setFieldError("現在のパスワードを入力してください");
      return;
    }
    if (typeof password !== "string" || password.length < 6) {
      setFieldError("新しいパスワードは6文字以上で入力してください");
      return;
    }
    if (password !== confirm) {
      setFieldError("確認用パスワードが一致しません");
      return;
    }

    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.ok) {
        formRef.current?.reset();
        setDone(true);
        // セッションの状態を最新化（万一サーバー側で再認証要求が出ても整合させる）。
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="current_password">現在のパスワード</Label>
        <Input
          id="current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          onChange={() => done && setDone(false)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">新しいパスワード</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={isPending}
          onChange={() => done && setDone(false)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password_confirm">新しいパスワード（確認）</Label>
        <Input
          id="password_confirm"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={isPending}
          onChange={() => done && setDone(false)}
        />
      </div>

      {fieldError ? (
        <p className="text-sm text-destructive" role="alert">
          {fieldError}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <p
          className="inline-flex items-center gap-1.5 text-sm text-[var(--green-dark)]"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          パスワードを変更しました
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={isPending}
          loadingText="変更中…"
        >
          パスワードを変更
        </Button>
      </div>
    </form>
  );
}
