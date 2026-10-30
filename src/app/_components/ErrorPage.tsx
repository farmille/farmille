"use client";

import * as Sentry from "@sentry/nextjs";

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
  // エラー境界は捕まえたエラーごとにこの画面をマウントし直す。
  useMountEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return;
    Sentry.captureException(error);
  });

  return (
    <FormPageShell chrome={chrome} backHref={backHref} title={pageTitle}>
      <PageNotice description={description} title={title}>
        <Button onClick={onRetry} type="button" variant="ghost">
          もう一度試す
        </Button>
      </PageNotice>
    </FormPageShell>
  );
}
