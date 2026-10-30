"use client";

import { useEffect } from "react";

import { toast } from "@/components/Toaster";

const messages = {
  posted: "感想口コミを投稿しました。",
  updated: "感想口コミを更新しました。",
  deleted: "感想口コミを削除しました。",
} as const;

type ReviewCompletion = keyof typeof messages;

function isReviewCompletion(value: string | null): value is ReviewCompletion {
  return value !== null && Object.hasOwn(messages, value);
}

export function useReviewCompletion() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const completion = url.searchParams.get("review");
    if (!isReviewCompletion(completion)) return;

    toast(messages[completion], { id: "review-completion" });
    url.searchParams.delete("review");
    // router.replace だとクエリを外すだけでページのサーバー描画をやり直すので、履歴だけを書き換える
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);
}
