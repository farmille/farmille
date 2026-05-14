"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  campaignId: string;
};

export function DeleteSection({ campaignId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch(
        `/api/maker/emails/campaigns/${campaignId}`,
        { method: "DELETE" },
      );

      if (res.status === 204 || res.ok) {
        router.push("/maker/emails");
        router.refresh();
        return;
      }

      const errBody = (await res.json().catch(() => ({}))) as {
        code?: string;
        error?: string;
      };
      if (errBody.code === "campaign_already_queued") {
        setError("送信予約済のキャンペーンは削除できません。");
      } else {
        setError("削除に失敗しました。時間をおいて再度お試しください。");
      }
    });
  };

  if (!confirming) {
    return (
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">削除</h2>
        <p className="text-sm text-muted-foreground">
          下書きキャンペーンを削除します。送信予約済以降は削除できません。
        </p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setConfirming(true)}
          disabled={isPending}
        >
          削除する
        </Button>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      className="rounded-md border border-destructive/30 bg-destructive/5 p-4 space-y-3"
      role="dialog"
      aria-label="削除の確認"
    >
      <p className="text-sm font-medium text-foreground">本当に削除しますか？</p>
      <p className="text-xs text-muted-foreground">
        この操作は取り消せません。
      </p>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          loading={isPending}
          loadingText="削除中…"
        >
          削除を確定する
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
    </section>
  );
}
