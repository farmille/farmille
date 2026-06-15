"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// レビュー承認フロー (2026-06-13): admin/reviews 行内の承認 / 却下アクション。
// 承認 → pending を approved にして公開。却下 → rejected (理由は任意、非公開のまま)。
// パターンは admin/reports/_components/resolve-action.tsx に揃える。

type Outcome = "approved" | "rejected";

export function ReviewModerationAction({
  reviewId,
  productName,
}: {
  reviewId: string;
  productName: string | null;
}) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Outcome | null>(null);

  async function run(outcome: Outcome) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const path =
        outcome === "approved"
          ? `/api/admin/reviews/${encodeURIComponent(reviewId)}/approve`
          : `/api/admin/reviews/${encodeURIComponent(reviewId)}/reject`;
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:
          outcome === "rejected"
            ? JSON.stringify({ reason: reason.trim() || null })
            : undefined,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(messageFor(body?.error));
        setBusy(false);
        return;
      }
      setDone(outcome);
      setTimeout(() => router.refresh(), 1200);
    } catch {
      setError("処理に失敗しました (ネットワーク)");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-1 text-xs text-[var(--green-dark)]"
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        {done === "approved" ? "公開しました" : "却下しました"}
      </span>
    );
  }

  if (rejecting) {
    return (
      <div className="flex flex-col gap-1.5 rounded border border-border bg-background p-2 min-w-[220px]">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="却下理由 (任意、admin 確認用)"
          maxLength={2000}
          rows={2}
          disabled={busy}
          className="rounded border border-border bg-background px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-1"
        />
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => run("rejected")}
            disabled={busy}
            className="h-7 px-2 text-xs"
          >
            {busy ? "送信中…" : "却下を確定"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setRejecting(false);
              setReason("");
              setError(null);
            }}
            disabled={busy}
            className="h-7 px-2 text-xs"
          >
            キャンセル
          </Button>
        </div>
        {error ? (
          <span className="text-xs text-destructive" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[160px]">
      <div className="flex gap-1">
        <Button
          type="button"
          size="sm"
          onClick={() => run("approved")}
          disabled={busy}
          className="h-7 px-3 text-xs"
          aria-label={`${productName ?? "この資材"} のレビューを承認して公開`}
        >
          {busy ? "処理中…" : "承認"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setRejecting(true)}
          disabled={busy}
          className="h-7 px-3 text-xs"
        >
          却下
        </Button>
      </div>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function messageFor(code: unknown): string {
  if (typeof code !== "string") return "処理に失敗しました";
  switch (code) {
    case "review_not_found":
      return "レビューが見つかりません";
    case "already_moderated":
      return "すでに処理済です";
    case "forbidden":
      return "権限がありません";
    case "aal2_required":
      return "2 要素認証が必要です";
    case "unauthorized":
      return "再ログインが必要です";
    default:
      return "処理に失敗しました";
  }
}
