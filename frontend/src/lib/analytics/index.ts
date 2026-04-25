import { sendGAEvent } from "@next/third-parties/google";

import type { AnalyticsEvent } from "./events";

export type { AnalyticsEvent } from "./events";

// dev 環境 + 環境変数未設定時は no-op
function isEnabled(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
  );
}

export function trackEvent(event: AnalyticsEvent): void {
  if (!isEnabled()) return;
  sendGAEvent("event", event.name, event.params);
}
