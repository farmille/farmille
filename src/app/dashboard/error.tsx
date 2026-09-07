"use client";

import { ErrorPage } from "@/app/_components/ErrorPage";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function DashboardError({ error, unstable_retry }: DashboardErrorProps) {
  return (
    <ErrorPage
      description="時間をおいてから、もう一度お試しください。"
      chrome="seller"
      error={error}
      onRetry={unstable_retry}
      pageTitle="メーカーダッシュボード"
      title="ダッシュボードを表示できませんでした"
    />
  );
}
