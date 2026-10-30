"use client";

import { PageNotice } from "@/components/PageNotice";

import { useErrorReporting } from "@/lib/hooks/use-error-reporting";

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
  useErrorReporting(error);

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
