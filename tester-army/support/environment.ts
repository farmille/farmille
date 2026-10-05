export const FARMILLE_E2E_ORIGIN = "http://localhost:3007";

export function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.length === 0) {
    throw new Error(`Tester Armyの実行には${name}が必要です。`);
  }
  return value;
}

export function localApplicationEnvironment() {
  const supabaseUrl = requiredEnvironment("NEXT_PUBLIC_SUPABASE_URL");
  if (new URL(supabaseUrl).origin !== "http://127.0.0.1:54321") {
    throw new Error("Tester Armyのデータ操作はローカルSupabaseに限ります。");
  }
  return {
    NEXT_PUBLIC_SITE_URL: FARMILLE_E2E_ORIGIN,
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requiredEnvironment(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    ),
    SUPABASE_SECRET_KEY: requiredEnvironment("SUPABASE_SECRET_KEY"),
    SMTP_URL: requiredEnvironment("SMTP_URL"),
    MAIL_FROM: requiredEnvironment("MAIL_FROM"),
    AUTH_EMAIL_HOOK_SECRET: requiredEnvironment("AUTH_EMAIL_HOOK_SECRET"),
  };
}
