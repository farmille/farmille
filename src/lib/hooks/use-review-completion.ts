"use client";

import { useEffect } from "react";
import { parseAsStringLiteral, useQueryState } from "nuqs";

import { toast } from "@/components/Toaster";

const completions = ["posted", "updated", "deleted"] as const;
const messages = {
  posted: "感想口コミを投稿しました。",
  updated: "感想口コミを更新しました。",
  deleted: "感想口コミを削除しました。",
} satisfies Record<(typeof completions)[number], string>;
const completionParser = parseAsStringLiteral(completions).withOptions({
  shallow: true,
  history: "replace",
});

export function useReviewCompletion() {
  const [completion, setCompletion] = useQueryState("review", completionParser);
  useEffect(() => {
    if (completion === null) return;
    toast(messages[completion], { id: "review-completion" });
    void setCompletion(null);
  }, [completion, setCompletion]);
}
