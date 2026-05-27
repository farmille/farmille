"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// spec §6.3: B1 承認 / 却下 Client Island。BFF を Next.js API route
// (/api/admin/makers/[id]/{approve,reject}) 経由で叩き、成功時に
// router.refresh() で Server Component を再フェッチさせる。
// Supabase SDK の直叩きは禁止 (spec §16.3)。
//
// UX (今日改善):
//   - 操作直後は inline success banner で「承認 / 却下しました」を 2 秒表示してから
//     router.refresh() (Material 3 Snackbar 相当、ライブラリ非依存)
//   - 却下理由は backend `logger.info` で audit trail (v1.5+ F-FU6 で DB 化)

type Busy = null | "approve" | "reject";
type Success = null | "approved" | "rejected";

const SUCCESS_BANNER_MS = 2000;

export function MakerActionButtons({
  userId,
  companyName,
}: {
  userId: string;
  companyName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState<Success>(null);

  // success banner を 2 秒表示してから router.refresh() で行が消える流れ。
  // refresh が先に走ると banner が消えてしまうため、setTimeout で順次。
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      router.refresh();
    }, SUCCESS_BANNER_MS);
    return () => clearTimeout(t);
  }, [success, router]);

  async function approve() {
    if (busy) return;
    if (
      !window.confirm(`「${companyName}」を承認しますか? 公開系に表示されます。`)
    ) {
      return;
    }
    setBusy("approve");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/makers/${encodeURIComponent(userId)}/approve`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          messageFromError(body?.error, "承認に失敗しました") +
            (res.status === 409 ? " (すでに処理済みの可能性)" : ""),
        );
        setBusy(null);
        return;
      }
      setSuccess("approved");
    } catch {
      setError("承認に失敗しました (ネットワーク)");
      setBusy(null);
    }
  }

  async function reject() {
    if (busy) return;
    setBusy("reject");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/makers/${encodeURIComponent(userId)}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason.trim() || null }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          messageFromError(body?.error, "却下に失敗しました") +
            (res.status === 409 ? " (すでに処理済みの可能性)" : ""),
        );
        setBusy(null);
        return;
      }
      setSuccess("rejected");
    } catch {
      setError("却下に失敗しました (ネットワーク)");
      setBusy(null);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 rounded border border-[var(--green-primary)] bg-[var(--green-subtle)] px-3 py-2 text-sm text-[var(--green-dark)]"
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        <span>
          {success === "approved"
            ? `「${companyName}」を承認しました`
            : `「${companyName}」を却下しました`}
        </span>
      </div>
    );
  }

  if (confirmReject) {
    return (
      <div className="rounded border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">
          「{companyName}」を却下します
        </p>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            却下理由 (任意、運用ログに記録されます。DB 保存は v1.5+ F-FU6 で対応)
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded border border-border bg-background p-2 text-sm"
            placeholder="例: 申請内容に不備があり再申請をお願いしています"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={reject}
            disabled={busy !== null}
          >
            {busy === "reject" ? "却下中…" : "却下を確定"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setConfirmReject(false);
              setReason("");
            }}
            disabled={busy !== null}
          >
            キャンセル
          </Button>
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center pt-1">
      <Button
        type="button"
        size="sm"
        onClick={approve}
        disabled={busy !== null}
      >
        {busy === "approve" ? "承認中…" : "承認"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirmReject(true)}
        disabled={busy !== null}
      >
        却下
      </Button>
      {error ? (
        <p className="text-sm text-destructive ml-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function messageFromError(code: unknown, fallback: string): string {
  if (typeof code !== "string") return fallback;
  switch (code) {
    case "maker_not_found":
      return "対象メーカーが見つかりません";
    case "maker_not_pending":
      return "すでに処理済みのメーカーです";
    case "not_admin":
      return "権限がありません";
    case "unauthorized":
      return "ログインが必要です";
    default:
      return fallback;
  }
}
