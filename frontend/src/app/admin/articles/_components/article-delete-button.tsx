"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle2 } from "lucide-react";

// Admin Articles CMS: 一覧行の削除 Client Island (ADR-0014)。
// confirm dialog → DELETE /api/admin/articles/{id} → router.refresh()。
// 記事はハード削除 (article_products は FK CASCADE)。hero 画像はバケットに残す。

export function ArticleDeleteButton({
  articleId,
  title,
}: {
  articleId: string;
  title: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function call() {
    if (busy) return;
    if (
      !window.confirm(
        `「${title}」を削除します。\n\n` +
          "・公開ページ / 一覧から消え、データも削除されます (復元不可)。\n" +
          "・関連資材の紐付け (article_products) も削除されます。\n" +
          "・hero 画像はストレージに残ります。\n\nよろしいですか?",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/articles/${encodeURIComponent(articleId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(messageFor(body?.error));
        setBusy(false);
        return;
      }
      setDone(true);
      setTimeout(() => router.refresh(), 1000);
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
        aria-label={`${title} を削除`}
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
    case "article_not_found":
      return "記事が見つかりません";
    case "forbidden":
    case "not_admin":
      return "権限がありません";
    case "aal2_required":
      return "MFA が必要です";
    case "unauthorized":
      return "再ログインが必要です";
    default:
      return "削除に失敗しました";
  }
}
