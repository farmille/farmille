"use client";
import { startTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { css } from "../../../../styled-system/css";
import { Button } from "@/components";
import { Notice } from "@/components/form";
import { retryApplicationMail } from "../actions";
import { errorMessageJa } from "@/server/errors";

type ReceiptMessage = { tone: "success" | "error"; text: string } | null;

export function ReceiptButtons({ id, sent }: { id: string; sent: boolean }) {
  const router = useRouter();
  const [message, retry, busy] = useActionState(
    async (_previous: ReceiptMessage): Promise<ReceiptMessage> => {
      try {
        const result = await retryApplicationMail(id);
        router.refresh();
        return result.ok
          ? { tone: "success", text: "メールの送信状況を確認しました。" }
          : { tone: "error", text: errorMessageJa[result.error] };
      } catch {
        return {
          tone: "error",
          text: "送信状況を確認できませんでした。時間をおいて再度お試しください。",
        };
      }
    },
    null,
  );
  return (
    <div
      className={css({
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "3",
        textStyle: "supporting",
      })}
    >
      <Button type="button" onClick={() => window.print()}>
        受付票を印刷・PDF保存
      </Button>
      {!sent && (
        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => startTransition(retry)}
        >
          控えメールを再送
        </Button>
      )}
      {message === null ? null : <Notice tone={message.tone}>{message.text}</Notice>}
    </div>
  );
}
