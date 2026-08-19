"use client";

import { ErrorPage } from "@/app/_components/ErrorPage";

type PostErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function PostError({ error, unstable_retry }: PostErrorProps) {
  return (
    <ErrorPage
      description="時間をおいて、もう一度お試しください。"
      error={error}
      onRetry={unstable_retry}
      pageTitle="投稿する"
      title="投稿先を読み込めませんでした"
    />
  );
}
