"use client";

import { parseAsStringLiteral, useQueryState } from "nuqs";

import { toast } from "@/components/Toaster";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";

const completions = ["posted", "updated", "deleted"] as const;

type Completion = (typeof completions)[number];

const messages = {
  posted: "感想口コミを投稿しました。",
  updated: "感想口コミを更新しました。",
  deleted: "感想口コミを削除しました。",
} satisfies Record<Completion, string>;

const completionParser = parseAsStringLiteral(completions).withOptions({
  shallow: true,
  history: "replace",
});

export function ReviewCompletionToast() {
  const [completion, setCompletion] = useQueryState("review", completionParser);

  if (completion === null) return null;

  return (
    <CompletionNotice
      key={completion}
      completion={completion}
      onShown={() => void setCompletion(null)}
    />
  );
}

function CompletionNotice({
  completion,
  onShown,
}: {
  completion: Completion;
  onShown: () => void;
}) {
  useMountEffect(() => {
    toast(messages[completion], { id: "review-completion" });
    onShown();
  });

  return null;
}
