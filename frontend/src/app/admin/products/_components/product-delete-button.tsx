"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle2 } from "lucide-react";

// 2026-05-27 追加: admin/products 行のソフト削除 Client Island。
// confirm dialog + soft delete API → router.refresh()。

export function ProductDeleteButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    if (busy) return;
    if (
      !window.confirm(
        `「${productName}」をソフト削除します。\n\n` +
          "・一覧 / 公開ページから消えますが、データ自体は残ります (復元は v1.5+ で UI 化)。\n" +
          "・関連レビュー / 画像も残ります (CASCADE しません)。\n\nよろしいですか?",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(productId)}/delete`,
        { method: "POST" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(messageFor(body?.error));
        setBusy(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.refresh(), 1200);
    } catch {
      setError("削除に失敗しました (ネットワーク)");
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
        削除しました
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={call}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded border border-destructive/40 px-2 py-0.5 text-xs text-destructive hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:opacity-50"
        aria-label={`${productName} をソフト削除`}
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" /> 削除
      </button>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function messageFor(code: unknown): string {
  if (typeof code !== "string") return "削除に失敗しました";
  switch (code) {
    case "product_not_found":
      return "資材が見つかりません";
    case "already_deleted":
      return "すでに削除済です";
    case "not_admin":
      return "権限がありません";
    case "unauthorized":
      return "再ログインが必要です";
    default:
      return "削除に失敗しました";
  }
}
