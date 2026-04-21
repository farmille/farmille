"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUp } from "@/lib/auth/actions";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const email = formData.get("email");
      const result = await signUp(formData);
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
          確認メールを送信しました
        </h2>
        <p className="text-base text-zinc-700 leading-relaxed">
          <span className="font-medium">{submittedEmail}</span> に確認メールを送信しました。
          メール内のリンクをクリックして登録を完了してください。
        </p>
        <p className="text-sm text-zinc-500">
          メールが届かない場合は迷惑メールフォルダもご確認ください。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-900">新規登録</h2>

      <form action={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="block text-base font-medium text-zinc-900">
            属性 <span className="text-red-600">*</span>
          </label>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-base text-zinc-800 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="farmer"
                required
                className="h-4 w-4"
              />
              農家
            </label>
            <label className="flex items-center gap-2 text-base text-zinc-800 cursor-pointer">
              <input
                type="radio"
                name="role"
                value="maker"
                required
                className="h-4 w-4"
              />
              資材メーカー
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-base font-medium text-zinc-900"
          >
            氏名 <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            maxLength={50}
            placeholder="例: 田中 太郎"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

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
            placeholder="例: tanaka@example.com"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-base font-medium text-zinc-900"
          >
            パスワード <span className="text-red-600">*</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="6文字以上"
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
          className="w-full rounded bg-zinc-900 py-2.5 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "送信中..." : "登録する"}
        </button>
      </form>

      <p className="text-sm text-zinc-600 text-center">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
