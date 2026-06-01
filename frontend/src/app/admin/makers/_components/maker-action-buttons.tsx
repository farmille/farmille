"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, EyeOff, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

// 2026-05-27 改修: 3 状態トグル (公開 / 非公開 / 取り下げ)。
// - 公開 (approve)    : status → active     (公開ページに表示、出品可能)
// - 非公開 (unpublish) : status → pending_review (一時 hide、再 toggle 可)
// - 取り下げ (reject)  : status → rejected   (spam / 規約違反、reason ログ)
//
// row の現 status に応じて押せるボタンが変わる:
//   active        : [非公開] [取り下げ]
//   pending_review: [公開]  [取り下げ]
//   rejected      : [公開]
//   frozen        : 凍結中バッジのみ (admin/users で解凍)

type MakerStatus = "active" | "pending_review" | "rejected" | "frozen";
type Variant = "publish" | "unpublish" | "reject";
type Busy = null | Variant;
type Success = null | Variant;

const SUCCESS_BANNER_MS = 1500;

export function MakerActionButtons({
  userId,
  companyName,
  currentStatus,
}: {
  userId: string;
  companyName: string;
  currentStatus: MakerStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);
  const [reason, setReason] = useState("");
  const [success, setSuccess] = useState<Success>(null);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.refresh(), SUCCESS_BANNER_MS);
    return () => clearTimeout(t);
  }, [success, router]);

  async function callPublish() {
    if (busy) return;
    if (
      !window.confirm(`「${companyName}」を公開します。\n公開ページの /manufacturers に表示され、出品も可能になります。よろしいですか?`)
    ) {
      return;
    }
    setBusy("publish");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/makers/${encodeURIComponent(userId)}/approve`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(messageFor(body?.error, "公開に失敗しました"));
        setBusy(null);
        return;
      }
      setSuccess("publish");
    } catch {
      setError("公開に失敗しました (ネットワーク)");
      setBusy(null);
    }
  }

  async function callUnpublish() {
    if (busy) return;
    if (
      !window.confirm(`「${companyName}」を非公開にします。\n公開ページから消えますが、本人 login や凍結ではありません。再度「公開」で復帰可能。よろしいですか?`)
    ) {
      return;
    }
    setBusy("unpublish");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/makers/${encodeURIComponent(userId)}/unpublish`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(messageFor(body?.error, "非公開に失敗しました"));
        setBusy(null);
        return;
      }
      setSuccess("unpublish");
    } catch {
      setError("非公開に失敗しました (ネットワーク)");
      setBusy(null);
    }
  }

  async function callReject() {
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
        setError(messageFor(body?.error, "取り下げに失敗しました"));
        setBusy(null);
        return;
      }
      setSuccess("reject");
    } catch {
      setError("取り下げに失敗しました (ネットワーク)");
      setBusy(null);
    }
  }

  if (success) {
    const label =
      success === "publish"
        ? "公開しました"
        : success === "unpublish"
          ? "非公開にしました"
          : "取り下げました";
    return (
      <div
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-2 rounded border border-[var(--green-primary)] bg-[var(--green-subtle)] px-3 py-2 text-sm text-[var(--green-dark)]"
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        <span>「{companyName}」を{label}</span>
      </div>
    );
  }

  if (currentStatus === "frozen") {
    return (
      <span className="text-xs text-muted-foreground italic">
        凍結中 (admin/users で解凍)
      </span>
    );
  }

  if (confirmReject) {
    return (
      <div className="rounded border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">
          「{companyName}」を取り下げます (rejected)
        </p>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            取り下げ理由 (任意、運用ログに記録されます)
          </span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={1000}
            className="w-full rounded border border-border bg-background p-2 text-sm"
            placeholder="例: 申請内容が規約違反"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={callReject}
            disabled={busy !== null}
          >
            {busy === "reject" ? "処理中…" : "取り下げを確定"}
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

  // status に応じて押せるボタンを出し分け
  const canPublish = currentStatus !== "active";
  const canUnpublish = currentStatus === "active";
  const canReject = currentStatus !== "rejected";

  return (
    <div className="flex flex-wrap gap-2 items-center pt-1">
      {canPublish ? (
        <Button
          type="button"
          size="sm"
          onClick={callPublish}
          disabled={busy !== null}
        >
          {busy === "publish" ? "公開中…" : "公開"}
        </Button>
      ) : null}
      {canUnpublish ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={callUnpublish}
          disabled={busy !== null}
          className="gap-1"
        >
          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
          {busy === "unpublish" ? "非公開化中…" : "非公開にする"}
        </Button>
      ) : null}
      {canReject ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirmReject(true)}
          disabled={busy !== null}
          className="gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
        >
          <Ban className="h-3.5 w-3.5" aria-hidden="true" />
          取り下げ
        </Button>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive ml-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function messageFor(code: unknown, fallback: string): string {
  if (typeof code !== "string") return fallback;
  switch (code) {
    case "maker_not_found":
      return "対象メーカーが見つかりません";
    case "already_active":
      return "すでに公開状態です";
    case "already_pending":
      return "すでに非公開状態です";
    case "already_rejected":
      return "すでに取り下げ済です";
    case "maker_frozen":
      return "凍結中のメーカーには操作できません (先に解凍)";
    case "not_admin":
      return "権限がありません";
    case "unauthorized":
      return "ログインが必要です";
    default:
      return fallback;
  }
}
