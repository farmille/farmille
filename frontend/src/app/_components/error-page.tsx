"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { Button, FormPageShell, SurfaceCard } from "@/components";

type ErrorPageProps = {
  error: Error & { digest?: string };
  onRetry: () => void;
  title: string;
  description: string;
  pageTitle?: string;
  backHref?: string;
};

export function ErrorPage({
  error,
  onRetry,
  title,
  description,
  pageTitle = "エラー",
  backHref = "/",
}: ErrorPageProps) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return;
    Sentry.captureException(error);
  }, [error]);

  return (
    <FormPageShell backHref={backHref} title={pageTitle}>
      <SurfaceCard description={description} title={title}>
        <Button onClick={onRetry} type="button" variant="ghost">
          もう一度試す
        </Button>
      </SurfaceCard>
    </FormPageShell>
  );
}
