"use client";

import * as Sentry from "@sentry/nextjs";
import { useReducer } from "react";

import { PageNotice } from "@/components/PageNotice";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";

import { Button, FormPageShell } from "@/components";
import type { AppChrome } from "@/components/AppBar";

type ErrorPageProps = {
  error: Error & { digest?: string };
  onRetry: () => void;
  title: string;
  description: string;
  pageTitle?: string;
  backHref?: string;
  chrome?: AppChrome;
};

export function ErrorPage({
  error,
  onRetry,
  title,
  description,
  pageTitle = "エラー",
  backHref = "/",
  chrome = "public",
}: ErrorPageProps) {
  // 再試行が別のエラーで失敗すると、この画面は残ったまま error だけが変わる。
  const [reported, report] = useReducer(
    (current: { error: Error; count: number }, next: Error) =>
      current.error === next ? current : { error: next, count: current.count + 1 },
    { error, count: 0 },
  );

  if (reported.error !== error) report(error);

  return (
    <FormPageShell chrome={chrome} backHref={backHref} title={pageTitle}>
      <ErrorReport key={reported.count} error={error} />
      <PageNotice description={description} title={title}>
        <Button onClick={onRetry} type="button" variant="ghost">
          もう一度試す
        </Button>
      </PageNotice>
    </FormPageShell>
  );
}

function ErrorReport({ error }: { error: Error }) {
  useMountEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return;
    Sentry.captureException(error);
  });

  return null;
}
