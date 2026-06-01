"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Map known GoTrue enroll failure modes to actionable user-facing copy.
// Falls back to generic message if the error doesn't match. We surface
// the raw message in a small dev hint for non-prod builds.
function mapEnrollError(error: { message?: string; name?: string } | null): string {
  const raw = error?.message ?? "";
  const lower = raw.toLowerCase();
  if (lower.includes("site url") && lower.includes("improperly formatted")) {
    return "Supabase プロジェクトの Site URL 設定が不正です。Dashboard → Authentication → URL Configuration を確認してください (scheme 必須、末尾 / なし)。";
  }
  if (lower.includes("mfa") && lower.includes("disabled")) {
    return "このプロジェクトでは MFA TOTP が無効化されています。Dashboard → Authentication → MFA で TOTP を有効化してください。";
  }
  if (lower.includes("over_request_rate_limit") || lower.includes("rate limit")) {
    return "リクエストが多すぎます。数十秒ほど待ってから再度お試しください。";
  }
  if (lower.includes("aal") && lower.includes("required")) {
    return "セッション状態が要件を満たしていません。一度サインアウトして再度ログインしてください。";
  }
  if (process.env.NODE_ENV !== "production" && raw) {
    return `2段階認証の登録に失敗しました (詳細: ${raw})`;
  }
  return "2段階認証の登録に失敗しました。時間をおいて再度お試しください。";
}

type EnrollState =
  | { status: "loading" }
  | {
      status: "ready";
      factorId: string;
      qrCodeSvg: string;
      secret: string;
    }
  | { status: "error"; message: string };

export function TotpEnrollForm({ next }: { next: string }) {
  const router = useRouter();
  const [state, setState] = useState<EnrollState>({ status: "loading" });
  const [code, setCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const supabase = createClient();
    const init = async () => {
      const { data: factors, error: listError } =
        await supabase.auth.mfa.listFactors();
      if (listError) {
        setState({
          status: "error",
          message: "認証アプリの設定状態を取得できませんでした。",
        });
        return;
      }
      const unverified = (factors?.all ?? []).filter(
        (f) => f.status === "unverified",
      );
      for (const factor of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error || !data) {
        setState({
          status: "error",
          message: mapEnrollError(error),
        });
        return;
      }
      setState({
        status: "ready",
        factorId: data.id,
        qrCodeSvg: data.totp.qr_code,
        secret: data.totp.secret,
      });
    };
    void init();
  }, []);

  const handleSubmit = (formData: FormData) => {
    setVerifyError(null);
    const submitted = formData.get("code");
    if (typeof submitted !== "string" || !/^\d{6}$/.test(submitted)) {
      setVerifyError("6 桁の数字を入力してください。");
      return;
    }
    if (state.status !== "ready") return;
    const factorId = state.factorId;

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: submitted,
      });
      if (error) {
        setVerifyError(
          "コードが正しくありません。認証アプリの最新コードを入力してください。",
        );
        return;
      }
      router.replace(next);
    });
  };

  if (state.status === "loading") {
    return (
      <div
        role="status"
        className="flex items-center justify-center py-10 text-sm text-zinc-600"
      >
        <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
        認証アプリ用 QR コードを生成中...
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
      >
        {state.message}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        {/* Supabase returns qr_code as inline SVG markup with its own
            width / height / viewBox. Render it raw inside a white box
            and force a sensible size with !important so the embedded
            attributes don't clip the quiet zone. */}
        <div
          role="img"
          aria-label="TOTP QR code"
          className="bg-white p-4 rounded border border-zinc-200 inline-block [&>svg]:!block [&>svg]:!w-56 [&>svg]:!h-56 [&>svg]:!max-w-none"
          dangerouslySetInnerHTML={{ __html: state.qrCodeSvg }}
        />
      </div>
      <div className="space-y-1">
        <label
          htmlFor="totp-secret"
          className="block text-sm font-medium text-zinc-900"
        >
          QR が読み取れない場合のシークレット
        </label>
        <input
          id="totp-secret"
          type="text"
          readOnly
          value={state.secret}
          className="w-full font-mono text-sm rounded border border-zinc-300 bg-zinc-50 px-3 py-2"
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="code"
            className="block text-base font-medium text-zinc-900"
          >
            認証アプリのコード <span className="text-red-600">*</span>
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
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="w-full rounded border border-zinc-300 px-3 py-2 text-base tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="000000"
          />
        </div>

        {verifyError && (
          <div
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {verifyError}
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
          {isPending ? "確認中..." : "2段階認証を有効化"}
        </button>
      </form>
    </div>
  );
}
