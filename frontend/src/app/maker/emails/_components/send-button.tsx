"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  campaignId: string;
  disabled?: boolean;
};

export function SendButton({ campaignId, disabled }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/maker/emails/campaigns/${campaignId}/send`,
        { method: "POST" },
      );

      if (res.ok) {
        setConfirming(false);
        router.refresh();
        return;
      }

      const errBody = (await res.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
      };
      switch (errBody.code) {
        case "campaign_already_queued":
          setError("このキャンペーンは既に送信予約済です。");
          break;
        case "no_recipients":
          setError("配信予定が 0 件のため送信予約できません。");
          break;
        case "event_not_owner":
          setError("指定の講演会は自社主催ではありません。");
          break;
        case "invalid_segment_filter":
          setError("配信先の指定内容を確認してください。");
          break;
        default:
          setError("送信予約に失敗しました。時間をおいて再度お試しください。");
      }
    });
  };

  if (!confirming) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={disabled || isPending}
        >
          送信予約する
        </Button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-md border border-border bg-muted/50 p-4 space-y-3"
      role="dialog"
      aria-label="送信予約の確認"
    >
      <p className="text-sm font-medium text-foreground">
        送信予約してよろしいですか？
      </p>
      <p className="text-xs text-muted-foreground">
        v1 では実際のメール送信は行われず、データベース上で送信予約（queued）の状態に
        遷移するのみです。実送信は別フェーズで対応予定です。
      </p>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleSend}
          loading={isPending}
          loadingText="予約中…"
        >
          送信予約を確定する
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(false)}
          disabled={isPending}
        >
          キャンセル
        </Button>
      </div>
    </div>
  );
}
