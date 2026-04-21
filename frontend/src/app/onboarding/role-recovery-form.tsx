"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RoleRecoveryForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const role = formData.get("role");
    if (role !== "farmer" && role !== "maker") {
      setError("属性を選択してください");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body?.error
            ? `登録の完了に失敗しました (${body.error})`
            : "登録の完了に失敗しました。時間をおいて再度お試しください",
        );
        return;
      }

      router.replace("/home");
      router.refresh();
    });
  };

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-base font-medium text-zinc-900">
          属性 <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-base text-zinc-800 cursor-pointer">
            <input type="radio" name="role" value="farmer" className="h-4 w-4" />
            農家
          </label>
          <label className="flex items-center gap-2 text-base text-zinc-800 cursor-pointer">
            <input type="radio" name="role" value="maker" className="h-4 w-4" />
            資材メーカー
          </label>
        </div>
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
        {isPending ? "処理中..." : "登録を完了する"}
      </button>
    </form>
  );
}
