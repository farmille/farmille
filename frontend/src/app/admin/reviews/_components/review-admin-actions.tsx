"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewModerationStatus } from "@/types/admin";

// 非公開化 + ハード削除 (stage1 / 2026-06-29)。
// - 非公開化: 承認済 (approved) レビューを rejected に戻し公開ページから消す。可逆。
//   pending は既存の承認/却下 (ReviewModerationAction) で扱うのでここでは出さない。
// - ハード削除: 行を物理削除する。復元不可なので window.confirm で確認。全 status で可。
// 設計は ReviewModerationAction に揃える (fetch → router.refresh)。

export function ReviewAdminActions({
  reviewId,
  status,
}: {
  reviewId: string;
  status: ReviewModerationStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"unpublish" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function unpublish() {
    if (busy) return;
    setBusy("unpublish");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/reviews/${encodeURIComponent(reviewId)}/unpublish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: null }),
        },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(messageFor(body?.error));
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("処理に失敗しました (ネットワーク)");
      setBusy(null);
    }
  }

  async function hardDelete() {
    if (busy) return;
    const ok = window.confirm(
      "このレビューを完全に削除します。画像も含めて元に戻せません。よろしいですか？",
    );
    if (!ok) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/reviews/${encodeURIComponent(reviewId)}`,
        { method: "DELETE" },
      );
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        setError(messageFor(body?.error));
        setBusy(null);
        return;
      }
      router.refresh();
    } catch {
      setError("削除に失敗しました (ネットワーク)");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        {status === "approved" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={unpublish}
            disabled={busy !== null}
          >
            <EyeOff className="mr-1 h-3 w-3" aria-hidden="true" />
            {busy === "unpublish" ? "処理中…" : "非公開化"}
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={hardDelete}
          disabled={busy !== null}
        >
          <Trash2 className="mr-1 h-3 w-3" aria-hidden="true" />
          {busy === "delete" ? "削除中…" : "削除"}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function messageFor(code: unknown): string {
  switch (code) {
    case "already_rejected":
      return "既に非公開です";
    case "review_not_found":
      return "レビューが見つかりません (再読み込みしてください)";
    case "forbidden":
    case "aal2_required":
      return "権限がありません (2FA 必須)";
    default:
      return "処理に失敗しました";
  }
}
