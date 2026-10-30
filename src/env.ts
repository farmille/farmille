function requireEnv(name: string, value: string | undefined): string {
  if (value === undefined || value.length === 0) {
    throw new Error(`必須の環境変数 ${name} が設定されていません。`);
  }

  return value;
}

// NEXT_PUBLIC_ 接頭辞を持つ値だけを、クライアントから参照できる集合に含める。
export const clientEnv = {
  get supabaseUrl(): string {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabasePublishableKey(): string {
    return requireEnv(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  get siteUrl(): string {
    return requireEnv("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL);
  },
};

// secret key はサーバー層からだけ参照する。
export const serverEnv = {
  get smtpUrl(): string {
    const value = requireEnv("SMTP_URL", process.env.SMTP_URL);
    const url = new URL(value);

    if (
      url.protocol !== "smtps:" &&
      !(url.protocol === "smtp:" && ["127.0.0.1", "localhost"].includes(url.hostname))
    ) {
      throw new Error("SMTP_URLはTLS接続を指定してください。平文SMTPはローカル検証に限ります。");
    }

    return value;
  },
  get mailFrom(): string {
    return requireEnv("MAIL_FROM", process.env.MAIL_FROM);
  },
  get authEmailHookSecret(): string {
    return requireEnv("AUTH_EMAIL_HOOK_SECRET", process.env.AUTH_EMAIL_HOOK_SECRET);
  },
  get supabaseSecretKey(): string {
    return requireEnv(
      "SUPABASE_SECRET_KEY",
      process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  get anthropicApiKey(): string {
    return requireEnv("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY);
  },
  get recaptchaSecretKey(): string {
    return requireEnv("RECAPTCHA_SECRET_KEY", process.env.RECAPTCHA_SECRET_KEY);
  },
  // ブラウザに出してよい値だが NEXT_PUBLIC_ ではないので、ページから props で渡す。
  get recaptchaSiteKey(): string {
    return requireEnv("RECAPTCHA_SITE_KEY", process.env.RECAPTCHA_SITE_KEY);
  },
};
