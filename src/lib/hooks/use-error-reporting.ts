"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export function useErrorReporting(error: Error) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()) return;
    Sentry.captureException(error);
  }, [error]);
}
