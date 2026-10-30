import { createClient } from "@supabase/supabase-js";
import { fn } from "storybook/test";
import type { Database } from "@/types/database.types";

function storybookClient() {
  return createClient<Database>("http://127.0.0.1:54321", "storybook-preview", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: () => {
        throw new Error("Storybookのデータ取得はserver mockで定義してください。");
      },
    },
  });
}

export const createServerSupabase = fn<typeof import("@/server/supabase").createServerSupabase>(
  async () => storybookClient(),
);

export const createAdminSupabase = fn<typeof import("@/server/supabase").createAdminSupabase>(() =>
  storybookClient(),
);
