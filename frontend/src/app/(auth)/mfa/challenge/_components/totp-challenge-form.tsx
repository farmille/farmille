"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function TotpChallengeForm({
  factorId,
  next,
}: {
  factorId: string;
  next: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError(null);
    const submitted = formData.get("code");
    if (typeof submitted !== "string" || !/^\d{6}$/.test(submitted)) {
      setError("6 桁の数字を入力してください。");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { error: verifyError } =
        await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: submitted,
        });
      if (verifyError) {
        setError(
          "コードが正しくありません。認証アプリの最新コードを入力してください。",
        );
        return;
      }
      router.replace(next);
    });
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="code"
          className="block text-base font-medium text-zinc-900"
        >
          認証コード <span className="text-red-600">*</span>
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="w-full rounded border border-zinc-300 px-3 py-2 text-base tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
          placeholder="000000"
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
        disabled={isPending || code.length !== 6}
        className="w-full inline-flex items-center justify-center gap-2 rounded bg-zinc-900 py-2.5 text-base font-medium text-white hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        )}
        {isPending ? "確認中..." : "ログインを完了"}
      </button>
    </form>
  );
}
