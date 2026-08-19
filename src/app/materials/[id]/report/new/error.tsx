"use client";

import { ErrorPage } from "@/app/_components/ErrorPage";

export default function ReportFormError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      description="通信状態を確認して、もう一度お試しください。入力済みの下書きは削除されません。"
      error={error}
      onRetry={reset}
      pageTitle="使用結果入力"
      title="入力画面を表示できませんでした"
    />
  );
}
