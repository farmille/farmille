"use client";

import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/env";
import type { Database } from "@/types/database.types";

/** WebAuthn の署名は端末で行い、セッションは既存の SSR Cookie と共有する。 */
export function createAuthBrowserClient() {
  return createBrowserClient<Database>(clientEnv.supabaseUrl, clientEnv.supabasePublishableKey, {
    auth: { experimental: { passkey: true } },
  });
}
