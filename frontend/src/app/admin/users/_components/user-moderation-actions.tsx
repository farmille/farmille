"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Snowflake, Sun, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserAccountStatus } from "@/types/admin";

// 2026-05-27 追加: admin/users 行内の凍結 / 凍結解除 / ソフト削除 Client Island。
// RoleChangeAction と並列に並べる前提 (table cell 内で flex)。
// 自分自身に対する操作は親側で hidden にする (自爆防止)。

type Variant = "freeze" | "unfreeze" | "delete";

const SUCCESS_BANNER_MS = 1500;

export function UserModerationActions({
  userId,
  displayName,
  currentStatus,
  isSelf,
}: {
  userId: string;
  displayName: string;
  currentStatus: UserAccountStatus;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Variant | null>(null);

  if (isSelf) {
    return (
      <span className="text-xs text-muted-foreground italic">
        本人 (操作不可)
      </span>
    );
  }

  async function call(variant: Variant) {
    if (busy) return;
    const verb =
      variant === "freeze"
        ? "凍結"
        : variant === "unfreeze"
          ? "凍結解除"
          : "削除";
    const confirmMsg =
      variant === "delete"
        ? `「${displayName}」を削除 (アカウント停止) します。\n\n` +
          "・公開ページ (資材 / レビュー / メーカー一覧) から非表示になります\n" +
          "・login が即時禁止されます\n" +
          "・通報履歴などの監査ログは保持されます\n" +
          "・復元が必要な場合は運営側で対応します\n\n" +
          "本当に削除しますか?"
        : variant === "freeze"
          ? `「${displayName}」を凍結します。\n\n・公開ページから消えます\n・login も即時禁止されます\n・凍結解除すれば元に戻ります\n\nよろしいですか?`
          : `「${displayName}」の凍結を解除します。再び login + 公開表示できるようになります。よろしいですか?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    setBusy(true);
    setError(null);
    const path =
      variant === "freeze"
        ? `/api/admin/users/${encodeURIComponent(userId)}/freeze`
        : variant === "unfreeze"
          ? `/api/admin/users/${encodeURIComponent(userId)}/unfreeze`
          : `/api/admin/users/${encodeURIComponent(userId)}/delete`;
    try {
      const res = await fetch(path, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(messageFor(body?.error, `${verb}に失敗しました`));
        setBusy(false);
        return;
      }
      setDone(variant);
      setTimeout(() => router.refresh(), SUCCESS_BANNER_MS);
    } catch {
      setError(`${verb}に失敗しました (ネットワーク)`);
      setBusy(false);
    }
  }

  if (done) {
    const label =
      done === "freeze"
        ? "凍結しました"
        : done === "unfreeze"
          ? "凍結解除しました"
          : "削除 (停止) しました";
    return (
      <span
        role="status"
        aria-live="polite"
        className="inline-flex items-center gap-1 rounded border border-[var(--green-primary)] bg-[var(--green-subtle)] px-2 py-1 text-xs text-[var(--green-dark)]"
      >
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        {label}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {currentStatus === "frozen" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => call("unfreeze")}
          disabled={busy}
          className="h-7 gap-1 px-2 text-xs"
          aria-label={`${displayName} を凍結解除`}
        >
          <Sun className="h-3 w-3" aria-hidden="true" /> 凍結解除
        </Button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => call("freeze")}
          disabled={busy || currentStatus === "rejected"}
          className="h-7 gap-1 px-2 text-xs"
          aria-label={`${displayName} を凍結`}
        >
          <Snowflake className="h-3 w-3" aria-hidden="true" /> 凍結
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => call("delete")}
        disabled={busy}
        className="h-7 gap-1 px-2 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
        aria-label={`${displayName} を削除`}
      >
        <Trash2 className="h-3 w-3" aria-hidden="true" /> 削除
      </Button>
      {error ? (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

function messageFor(code: unknown, fallback: string): string {
  if (typeof code !== "string") return fallback;
  switch (code) {
    case "user_not_found":
      return "対象ユーザーが見つかりません";
    case "already_frozen":
      return "すでに凍結されています";
    case "not_frozen":
      return "凍結されていません";
    case "user_deleted":
      return "削除済みのアカウントは凍結解除できません";
    case "cannot_delete_self":
    case "cannot_modify_self":
      return "自分自身は操作できません";
    case "cannot_delete_admin":
    case "cannot_freeze_admin":
      return "管理者アカウントは操作できません";
    case "delete_failed":
      return "削除 (停止) に失敗しました";
    case "forbidden":
    case "not_admin":
      return "権限がありません";
    case "aal2_required":
      return "2 段階認証 (AAL2) が必要です";
    case "unauthorized":
      return "ログインが必要です";
    default:
      return fallback;
  }
}
