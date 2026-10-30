"use client";
import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { css } from "../../../../styled-system/css";
import { Button } from "@/components";
import { Notice } from "@/components/form";
import { retryApplicationMail } from "../actions";
import { errorMessageJa } from "@/server/errors";
export function ReceiptButtons({ id, sent }: { id: string; sent: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useReducer((_state: boolean, next: boolean) => next, false);
  const [message, setMessage] = useReducer(
    (
      _state: { tone: "success" | "error"; text: string } | null,
      next: { tone: "success" | "error"; text: string } | null,
    ) => next,
    null,
  );
  async function retry() {
    setBusy(true);
    try {
      const result = await retryApplicationMail(id);
      setMessage(
        result.ok
          ? { tone: "success", text: "メールの送信状況を確認しました。" }
          : { tone: "error", text: errorMessageJa[result.error] },
      );
      router.refresh();
    } catch {
      setMessage({
        tone: "error",
        text: "送信状況を確認できませんでした。時間をおいて再度お試しください。",
      });
    } finally {
      setBusy(false);
    }
  }
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
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void retry()}>
          控えメールを再送
        </Button>
      )}
      {message === null ? null : <Notice tone={message.tone}>{message.text}</Notice>}
    </div>
  );
}
