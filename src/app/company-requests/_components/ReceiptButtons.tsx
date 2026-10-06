"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { css, cx } from "../../../../styled-system/css";
import { Button } from "@/components";
import { retryApplicationMail } from "../actions";
import { errorMessageJa } from "@/server/errors";
export function ReceiptButtons({ id, sent }: { id: string; sent: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function retry() {
    setBusy(true);
    try {
      const result = await retryApplicationMail(id);
      setMessage(result.ok ? "メールの送信状況を確認しました。" : errorMessageJa[result.error]);
      router.refresh();
    } catch {
      setMessage("送信状況を確認できませんでした。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className={cx(
        "application-print-hidden",
        css({
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "3",
          fontSize: "md",
          lineHeight: "relaxed",
        }),
      )}
    >
      <Button type="button" onClick={() => window.print()}>
        受付票を印刷・PDF保存
      </Button>
      {!sent && (
        <Button type="button" variant="ghost" disabled={busy} onClick={() => void retry()}>
          控えメールを再送
        </Button>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
