"use client";

import { Toggle } from "@base-ui/react/toggle";
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
  return (
    <Toggle
      aria-label={isSaved ? "保存を解除" : "投稿を保存"}
      pressed={isSaved}
      disabled={pending || action === undefined}
      className={css({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        p: "1.5",
        borderRadius: "button",
        border: "none",
        bg: "transparent",
        color: "text.brand",
        cursor: "pointer",
        _disabled: { cursor: "default", opacity: "[0.5]" },
      })}
      onPressedChange={(next) => {
        if (action === undefined) return;
        startTransition(async () => {
          setSaved(await action(next));
        });
      }}
    >
      <Icon name={isSaved ? "bookmark_filled" : "bookmark"} size="sm" />
    </Toggle>
  );
}
