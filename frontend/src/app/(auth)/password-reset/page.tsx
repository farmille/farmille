"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth/actions";

export default function PasswordResetPage() {
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const email = formData.get("email");
      const result = await requestPasswordReset(formData);
      if (result.ok) {
        setSubmittedEmail(typeof email === "string" ? email : "");
      } else {
        setError(result.error);
      }
    });
  };

  if (submittedEmail !== null) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">
          メールを送信しました
        </h2>
        <p className="text-base text-zinc-700 leading-relaxed">
          <span className="font-medium">{submittedEmail}</span> にパスワード再設定用のメールを送信しました。
          メール内のリンクをクリックして新しいパスワードを設定してください。
        </p>
        <p className="text-sm text-zinc-500">
          メールが届かない場合は迷惑メールフォルダもご確認ください。
        </p>
        <p className="text-sm text-zinc-600 text-center pt-4">
          <Link href="/login" className="font-medium text-zinc-900 underline">
            ログイン画面に戻る
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-900">
        パスワードを再設定
      </h2>
      <p className="text-sm text-zinc-600 leading-relaxed">
        登録済みのメールアドレスを入力してください。パスワード再設定用のリンクを記載したメールをお送りします。
      </p>

      <form action={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-base font-medium text-zinc-900"
          >
            メールアドレス <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded border border-zinc-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 rounded bg-zinc-900 py-2.5 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {isPending ? "送信中..." : "再設定メールを送信"}
        </button>
      </form>

      <p className="text-sm text-zinc-600 text-center">
        <Link href="/login" className="font-medium text-zinc-900 underline">
          ログイン画面に戻る
        </Link>
      </p>
    </div>
  );
}
