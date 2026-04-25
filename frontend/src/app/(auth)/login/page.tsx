"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth/actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-900">ログイン</h2>

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
          {isPending ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <p className="text-sm text-zinc-600 text-center">
        <Link
          href="/password-reset"
          className="font-medium text-zinc-900 underline"
        >
          パスワードをお忘れですか？
        </Link>
      </p>

      <p className="text-sm text-zinc-600 text-center">
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="font-medium text-zinc-900 underline">
          新規登録
        </Link>
      </p>
    </div>
  );
}
