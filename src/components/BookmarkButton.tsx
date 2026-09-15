"use client";

import { useState, useTransition } from "react";
import { Icon } from "./Icon";
import { css } from "../../styled-system/css";

type BookmarkButtonProps = {
  saved: boolean;
  action?: (saved: boolean) => Promise<boolean>;
};

/** 保存処理が成功した状態だけを表示する。送信中の連打を防ぐ。 */
export function BookmarkButton({ saved, action }: BookmarkButtonProps) {
  const [isSaved, setSaved] = useState(saved);
  const [pending, startTransition] = useTransition();
  const label = isSaved ? "保存を解除" : "投稿を保存";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={isSaved}
      disabled={pending || action === undefined}
      className={css({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        p: "1.5",
        borderRadius: "button",
        border: "none",
        bg: "transparent",
        color: "brand.primaryDeep",
        cursor: "pointer",
        _disabled: { cursor: "default", opacity: "0.5" },
      })}
      onClick={() => {
        if (action === undefined) return;
        startTransition(async () => {
          setSaved(await action(!isSaved));
        });
      }}
    >
      <Icon name={isSaved ? "bookmark_filled" : "bookmark"} size="sm" />
    </button>
  );
}
