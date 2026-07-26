"use client";

import { useEffect, useState } from "react";

import { css } from "../../styled-system/css";

const messages = {
  posted: "レビューを投稿しました。",
  updated: "レビューを更新しました。",
  deleted: "レビューを削除しました。",
} as const;

type ReviewCompletion = keyof typeof messages;

function isReviewCompletion(value: string | null): value is ReviewCompletion {
  return value !== null && Object.hasOwn(messages, value);
}

export function ReviewCompletionToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const completion = new URLSearchParams(window.location.search).get("review");
    if (!isReviewCompletion(completion)) return;

    let hideTimeoutId: number | undefined;
    const showTimeoutId = window.setTimeout(() => {
      setMessage(messages[completion]);
      hideTimeoutId = window.setTimeout(() => setMessage(null), 4_000);
    }, 0);

    return () => {
      window.clearTimeout(showTimeoutId);
      if (hideTimeoutId !== undefined) window.clearTimeout(hideTimeoutId);
    };
  }, []);

  if (message === null) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className={css({
        position: "fixed",
        top: "16",
        left: "4",
        right: "4",
        zIndex: "30",
        maxW: "sm",
        mx: "auto",
        m: "0",
        px: "4",
        py: "3",
        bg: "brand.primaryDeep",
        color: "surface.card",
        borderRadius: "card",
        boxShadow: "shadow.lift",
        fontSize: "sm",
        fontWeight: "700",
        textAlign: "center",
      })}
    >
      {message}
    </p>
  );
}
