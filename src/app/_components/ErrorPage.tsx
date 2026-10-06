"use client";

import { PageNotice } from "@/components/PageNotice";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return;
    Sentry.captureException(error);
  }, [error]);

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
