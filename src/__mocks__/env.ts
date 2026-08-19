// Storybook のブラウザ内だけで使う公開設定。実プロジェクトの環境変数は参照しない。
export const clientEnv = {
  supabaseUrl: "https://storybook.invalid",
  supabasePublishableKey: "storybook-publishable-key",
  siteUrl: "http://localhost:6006",
};

export const serverEnv = {
  supabaseSecretKey: "storybook-secret-key",
};
