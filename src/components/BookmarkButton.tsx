"use client";

import { Toggle } from "@base-ui/react/toggle";
import { startTransition, useActionState } from "react";
import { Icon } from "./Icon";
import { css } from "../../styled-system/css";

type BookmarkButtonProps = {
  saved: boolean;
  action?: (saved: boolean) => Promise<boolean>;
};

/** 保存処理が成功した状態だけを表示する。送信中の連打を防ぐ。 */
export function BookmarkButton({ saved, action }: BookmarkButtonProps) {
  const [isSaved, save, pending] = useActionState(async (current: boolean, next: boolean) => {
    return action === undefined ? current : action(next);
  }, saved);
  return (
    <Toggle
      pressed={isSaved}
      disabled={pending || action === undefined}
      className={css({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5",
        flexShrink: "0",
        // 指で押せるよう、押せる範囲を 44px 四方以上取る
        minW: "11",
        h: "11",
        px: "1",
        borderRadius: "button",
        border: "none",
        bg: "transparent",
        color: "text.brand",
        fontSize: "md",
        whiteSpace: "nowrap",
        cursor: "pointer",
        _disabled: { cursor: "default", opacity: "[0.5]" },
      })}
      onPressedChange={(next) => {
        if (action === undefined) return;
        startTransition(() => save(next));
      }}
    >
      <Icon name={isSaved ? "bookmark_filled" : "bookmark"} size="sm" />
      {isSaved ? "保存済み" : "保存"}
    </Toggle>
  );
}
