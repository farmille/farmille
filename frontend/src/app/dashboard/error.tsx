"use client";

import { ErrorPage } from "@/app/_components/error-page";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function DashboardError({ error, unstable_retry }: DashboardErrorProps) {
  return (
    <ErrorPage
      description="時間をおいてから、もう一度お試しください。"
      error={error}
      onRetry={unstable_retry}
      pageTitle="出品者ダッシュボード"
      title="ダッシュボードを表示できませんでした"
    />
  );
}
