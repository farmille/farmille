// ローカル検証用の admin アカウント作成スクリプト（T-44）。
//
// !!! リモート（Supabase クラウドの dev / 本番プロジェクト）では実行しない !!!
// 運営アカウントの発行は運用手順（人間の作業）であり、このスクリプトはローカルの
// `supabase start` で立ち上げたインスタンスに対してのみ使う。接続先がローカルの
// ホストでない場合は何もせず異常終了する（下の assertLocalSupabase）。
//
// 使い方（.env.local の値をそのまま使う）：
//   node --env-file=.env.local tools/dev/create-local-admin.ts <email> [password]
//
// password を省略した場合は安全な乱数で生成して一度だけ表示する。
// 既に同じメールのユーザーが居る場合は app_metadata.account_type='admin' を付け直す
// （パスワードは変更しない）。
//
// 作成後の MFA（TOTP）登録は画面から行う: /admin へアクセスすると AAL1 の admin は
// /admin/mfa へ誘導される（01 §4 の AAL2 必須）。

import { randomBytes } from "node:crypto";

type AuthUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
};

function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.length === 0) {
    throw new Error(`必須の環境変数 ${name} が設定されていません。`);
  }

  return value;
}

/** 接続先がローカルの Supabase であることを確認する。クラウドの URL なら止める。 */
function assertLocalSupabase(rawUrl: string): URL {
  const url = new URL(rawUrl);
  const localHosts = ["127.0.0.1", "localhost", "::1", "[::1]"];

  if (!localHosts.includes(url.hostname)) {
    throw new Error(
      `ローカル以外の Supabase (${url.origin}) には実行できません。` +
        "このスクリプトはローカル検証専用です。",
    );
  }

  return url;
}

/** 表示・入力しやすい文字種で 24 文字。crypto の乱数から偏りなく選ぶ。 */
function generatePassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const length = 24;
  const limit = 256 - (256 % alphabet.length);
  const chars: string[] = [];

  while (chars.length < length) {
    for (const byte of randomBytes(length)) {
      if (byte >= limit) continue;
      chars.push(alphabet[byte % alphabet.length]);
      if (chars.length === length) break;
    }
  }

  return chars.join("");
}

async function callAuthAdmin(
  baseUrl: URL,
  secretKey: string,
  path: string,
  init: { method: string; body?: unknown },
): Promise<unknown> {
  const response = await fetch(new URL(`/auth/v1/admin${path}`, baseUrl), {
    method: init.method,
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });

  const payload: unknown = await response.json();

  if (!response.ok) {
    throw new Error(`Auth Admin API ${init.method} ${path} が失敗しました: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function findUserByEmail(
  baseUrl: URL,
  secretKey: string,
  email: string,
): Promise<AuthUser | null> {
  const payload = await callAuthAdmin(
    baseUrl,
    secretKey,
    `/users?page=1&per_page=1000`,
    { method: "GET" },
  );

  if (typeof payload !== "object" || payload === null || !("users" in payload)) {
    throw new Error("Auth Admin API のユーザー一覧の形式が想定と異なります。");
  }

  const users = (payload as { users: AuthUser[] }).users;

  return users.find((user) => user.email === email) ?? null;
}

async function main(): Promise<void> {
  const [email, passwordArg] = process.argv.slice(2);

  if (email === undefined || email.length === 0) {
    throw new Error(
      "メールアドレスを指定してください: " +
        "node --env-file=.env.local tools/dev/create-local-admin.ts <email> [password]",
    );
  }

  const baseUrl = assertLocalSupabase(requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const secretKey = requireEnv("SUPABASE_SECRET_KEY");
  const password = passwordArg ?? generatePassword();

  const existing = await findUserByEmail(baseUrl, secretKey, email);

  if (existing === null) {
    const created = (await callAuthAdmin(baseUrl, secretKey, "/users", {
      method: "POST",
      body: {
        email,
        password,
        email_confirm: true,
        app_metadata: { account_type: "admin" },
      },
    })) as AuthUser;

    console.info(`admin を作成しました: ${email} (user_id=${created.id})`);
    console.info(`パスワード: ${password}`);
  } else {
    await callAuthAdmin(baseUrl, secretKey, `/users/${existing.id}`, {
      method: "PUT",
      body: { app_metadata: { ...existing.app_metadata, account_type: "admin" } },
    });

    console.info(`既存ユーザーに admin を付与しました: ${email} (user_id=${existing.id})`);
    console.info("パスワードは変更していません。");
  }

  console.info("次の手順: /login からログイン → /admin へアクセスすると MFA 登録へ誘導されます。");
}

await main();
