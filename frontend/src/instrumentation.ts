import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export const onRequestError = Sentry.captureRequestError;
