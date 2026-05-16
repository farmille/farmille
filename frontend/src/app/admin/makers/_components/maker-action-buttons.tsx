"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// spec §6.3: B1 承認 / 却下 Client Island。BFF を Next.js API route
// (/api/admin/makers/[id]/{approve,reject}) 経由で叩き、成功時に
// router.refresh() で Server Component を再フェッチさせる。
// Supabase SDK の直叩きは禁止 (spec §16.3)。

type Busy = null | "approve" | "reject";

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
      router.refresh();
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
      router.refresh();
    } catch {
      setError("却下に失敗しました (ネットワーク)");
      setBusy(null);
    }
  }

  if (confirmReject) {
    return (
      <div className="rounded border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">
          「{companyName}」を却下します
        </p>
        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">
            却下理由 (任意、v1 では DB 保存しません)
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
