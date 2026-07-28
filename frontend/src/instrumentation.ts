import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

// Server Components・Route Handlers・Proxy の未処理例外を Sentry へ渡す。
export const onRequestError = Sentry.captureRequestError;
