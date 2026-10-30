"use client";

import { useEffect } from "react";
import { loadRecaptcha } from "@/lib/recaptcha-client";

export function useRecaptcha(siteKey: string) {
  useEffect(() => {
    // 先読みの失敗は操作を妨げず、送信時のexecuteRecaptchaで再試行して利用者に知らせる。
    void loadRecaptcha(siteKey).catch(() => undefined);
  }, [siteKey]);
}
