"use client";

import { useEffect, useState } from "react";

import { css } from "../../styled-system/css";

const messages = {
  posted: "感想口コミを投稿しました。",
  updated: "感想口コミを更新しました。",
  deleted: "感想口コミを削除しました。",
} as const;

const VISIBLE_MS = 4_000;
/** tokens.durations.toast と揃える。退場し終えてから外す。 */
const LEAVE_MS = 400;

type ReviewCompletion = keyof typeof messages;

function isReviewCompletion(value: string | null): value is ReviewCompletion {
  return value !== null && Object.hasOwn(messages, value);
}

/**
 * 上端から降りてきて、同じ上端へ戻る。
 * 短い間隔で出し直されても値が積み上がらないよう、キーフレームではなくトランジションで補間する。
 */
const toast = css({
  position: "fixed",
  top: "16",
  left: "4",
  right: "4",
  zIndex: "30",
  maxW: "dialog",
  mx: "auto",
  m: "0",
  px: "4",
  py: "3",
  bg: "primary.700",
  color: "text.inverse",
  borderRadius: "card",
  boxShadow: "shadow.lift",
  fontSize: "sm",
  fontWeight: "bold",
  textAlign: "center",
  opacity: "1",
  transform: "translateY(0)",
  transitionProperty: "opacity, transform",
  transitionDuration: "toast",
  transitionTimingFunction: "soft",
  "@starting-style": {
    opacity: "0",
    transform: "translateY(-100%)",
  },
  "&[data-leaving]": {
    opacity: "0",
    transform: "translateY(-100%)",
  },
  "@media (prefers-reduced-motion: reduce)": {
    transform: "none",
    "@starting-style": { transform: "none" },
    "&[data-leaving]": { transform: "none" },
  },
});

export function ReviewCompletionToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const completion = new URLSearchParams(window.location.search).get("review");
    if (!isReviewCompletion(completion)) return;

    let leaveTimeoutId: number | undefined;
    let removeTimeoutId: number | undefined;
    const showTimeoutId = window.setTimeout(() => {
      setMessage(messages[completion]);
      leaveTimeoutId = window.setTimeout(() => setLeaving(true), VISIBLE_MS);
      removeTimeoutId = window.setTimeout(() => setMessage(null), VISIBLE_MS + LEAVE_MS);
    }, 0);

    return () => {
      window.clearTimeout(showTimeoutId);
      if (leaveTimeoutId !== undefined) window.clearTimeout(leaveTimeoutId);
      if (removeTimeoutId !== undefined) window.clearTimeout(removeTimeoutId);
    };
  }, []);

  if (message === null) return null;

  return (
    <p role="status" aria-live="polite" className={toast} data-leaving={leaving ? "" : undefined}>
      {message}
    </p>
  );
}
