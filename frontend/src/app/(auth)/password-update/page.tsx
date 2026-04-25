"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { updatePassword } from "@/lib/auth/actions";

export default function PasswordUpdatePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    setFieldError(null);

    const password = formData.get("password");
    const confirm = formData.get("password_confirm");

    if (typeof password !== "string" || password.length < 6) {
      setFieldError("パスワードは6文字以上で入力してください");
      return;
    }
    if (password !== confirm) {
      setFieldError("確認用パスワードが一致しません");
      return;
    }

    startTransition(async () => {
      const result = await updatePassword(formData);
      if (result.ok) {
        router.replace("/login?reset=1");
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-zinc-900">
        新しいパスワードを設定
      </h2>
      <p className="text-sm text-zinc-600 leading-relaxed">
        新しいパスワードを入力して、パスワードを更新してください。
      </p>

      <form action={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-base font-medium text-zinc-900"
          >
            新しいパスワード <span className="text-red-600">*</span>
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

        <div className="space-y-2">
          <label
            htmlFor="password_confirm"
            className="block text-base font-medium text-zinc-900"
          >
            新しいパスワード（確認用） <span className="text-red-600">*</span>
          </label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            required
            minLength={6}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        {fieldError && (
          <div
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {fieldError}
          </div>
        )}

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
          {isPending ? "更新中..." : "パスワードを更新"}
        </button>
      </form>
    </div>
  );
}
