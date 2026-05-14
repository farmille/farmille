"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { isReviewerRole } from "@/lib/auth/roles";
import type { Role } from "@/lib/auth/roles";

type Props = {
  eventId: string;
  role: Role | null;
  isAuthenticated: boolean;
  isFull: boolean;
};

export function RegisterButton({
  eventId,
  role,
  isAuthenticated,
  isFull,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ryoga 確定 C11: 未ログインでもボタン表示、クリックで /login?next=... 誘導
  if (!isAuthenticated) {
    const nextPath = `/events/${eventId}`;
    return (
      <div className="space-y-2">
        <a
          href={`/login?next=${encodeURIComponent(nextPath)}`}
          className="inline-flex items-center justify-center rounded-sm border border-primary bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
        >
          ログインして申込む
        </a>
        <p className="text-xs text-muted-foreground">
          申込にはログインが必要です。
        </p>
      </div>
    );
  }

  // Ryoga 確定 C8: maker / unassigned はボタン disabled + 理由メッセージ
  if (!isReviewerRole(role)) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-sm border border-border bg-muted px-6 py-3 text-base font-medium text-muted-foreground cursor-not-allowed"
        >
          申込む
        </button>
        <p className="text-xs text-muted-foreground">
          この機能は農家・JA普及員・研究者向けです。
        </p>
      </div>
    );
  }

  // reviewer。満席なら disabled。
  if (isFull && !registered) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-sm border border-border bg-muted px-6 py-3 text-base font-medium text-muted-foreground cursor-not-allowed"
        >
          定員に達しました
        </button>
        <p className="text-xs text-muted-foreground">
          この講演会は定員に達しました。
        </p>
      </div>
    );
  }

  const handleRegister = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
      });
      if (res.status === 201) {
        setRegistered(true);
        router.refresh();
        return;
      }
      const body = (await res.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
      };
      if (res.status === 409 && body.code === "already_registered") {
        setRegistered(true);
        return;
      }
      if (res.status === 409 && body.code === "event_full") {
        setError("定員に達しました。");
        return;
      }
      setError("申込に失敗しました。時間をおいて再度お試しください。");
    });
  };

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: "DELETE",
      });
      if (res.status === 204) {
        setRegistered(false);
        router.refresh();
        return;
      }
      if (res.status === 404) {
        // 既に取消済 / レコードなし → 取消完了扱い
        setRegistered(false);
        return;
      }
      setError("取消に失敗しました。時間をおいて再度お試しください。");
    });
  };

  if (registered) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleCancel}
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-sm border border-border bg-card px-6 py-3 text-base font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          {isPending ? "処理中…" : "申込を取消す"}
        </button>
        <p className="text-xs text-muted-foreground">
          申込済みです。取消すと再申込はできません。
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRegister}
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-sm border border-primary bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
      >
        {isPending ? "処理中…" : "申込む"}
      </button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
