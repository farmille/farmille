"use client";

import { ErrorPage } from "@/app/_components/ErrorPage";

type ReviewErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function ReviewError({ error, unstable_retry }: ReviewErrorProps) {
  return (
    <ErrorPage
      description="時間をおいて、もう一度お試しください。"
      error={error}
      onRetry={unstable_retry}
      pageTitle="レビュー"
      title="レビュー画面を読み込めませんでした"
    />
  );
}
