"use client";

import { ErrorPage } from "@/app/_components/ErrorPage";

type ErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function Error({ error, unstable_retry }: ErrorProps) {
  return (
    <ErrorPage
      description="時間をおいてから、もう一度お試しください。"
      error={error}
      onRetry={unstable_retry}
      title="ページを表示できませんでした"
    />
  );
}
