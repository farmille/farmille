"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { toast } from "./Toaster";

const messages = {
  posted: "感想口コミを投稿しました。",
  updated: "感想口コミを更新しました。",
  deleted: "感想口コミを削除しました。",
} as const;

type ReviewCompletion = keyof typeof messages;

function isReviewCompletion(value: string | null): value is ReviewCompletion {
  return value !== null && Object.hasOwn(messages, value);
}

/**
 * 投稿・更新・削除から戻った直後に ?review= を読んで1度だけ通知し、
 * 再読み込みで出し直さないようクエリから外す。
 */
export function ReviewCompletionToast() {
  const router = useRouter();

  useEffect(() => {
    const url = new URL(window.location.href);
    const completion = url.searchParams.get("review");
    if (!isReviewCompletion(completion)) return;

    // 開発時の二重実行でも同じ通知を1枚に保つ
    toast(messages[completion], { id: "review-completion" });
    url.searchParams.delete("review");
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }, [router]);

  return null;
}
