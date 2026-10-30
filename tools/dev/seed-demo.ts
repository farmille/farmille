// ローカル検証用：デモアカウントのパスワードを既知の値に揃える。
//
// !!! リモート（Supabase クラウドの dev / 本番プロジェクト）では実行しない !!!
// 接続先がローカルのホストでない場合は何もせず異常終了する。
//
// 使い方:
//   node --env-file=.env.local tools/dev/seed-demo.ts
//
// 公開ホームの表示データは tools/dev/seed-home-demo.sql、運営画面の確認データは
// tools/dev/seed-demo.sql を psql で流す。3つを実行すると全画面が空でない状態になる。

import * as v from "valibot";

const DEMO_PASSWORD = "Farmille#Local2026";

const AuthUserSchema = v.object({
  id: v.string(),
  email: v.optional(v.string()),
  app_metadata: v.optional(v.object({ account_type: v.optional(v.string()) })),
});

const AuthUserListSchema = v.object({ users: v.array(AuthUserSchema) });

type AuthUser = v.InferOutput<typeof AuthUserSchema>;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.length === 0) {
    throw new Error(`必須の環境変数 ${name} が設定されていません。`);
  }

  return value;
}

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

const supabaseUrl = assertLocalSupabase(
  requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
).origin;

const secretKey = requireEnv("SUPABASE_SECRET_KEY");

const authHeaders = {
  apikey: secretKey,
  Authorization: `Bearer ${secretKey}`,
  "Content-Type": "application/json",
};

async function listUsers(): Promise<AuthUser[]> {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=200`, {
    headers: authHeaders,
  });

  if (!res.ok) {
    throw new Error(`ユーザー一覧の取得に失敗しました: ${res.status}`);
  }

  const result = v.safeParse(AuthUserListSchema, await res.json());

  if (!result.success) {
    throw new Error(`ユーザー一覧の形式が不正です：${v.summarize(result.issues)}`);
  }

  return result.output.users;
}

async function setPassword(userId: string, password: string): Promise<void> {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    throw new Error(`パスワード更新に失敗しました (${userId}): ${res.status}`);
  }
}

function isDemoAccount(user: AuthUser): boolean {
  const email = user.email ?? "";

  return (
    email.endsWith("@sellers.farmille.internal") ||
    email === "shiosai@example.com" ||
    email === "admin@example.com"
  );
}

async function main(): Promise<void> {
  console.log(`接続先: ${supabaseUrl}`);

  const targets = (await listUsers()).filter(isDemoAccount);

  if (targets.length === 0) {
    throw new Error(
      "デモアカウントが見つかりません。`supabase db reset` と seed の投入を先に行ってください。",
    );
  }

  for (const user of targets) {
    await setPassword(user.id, DEMO_PASSWORD);
    console.log(
      `  更新: ${user.email} (${String(user.app_metadata?.account_type ?? "-")})`,
    );
  }

  console.log(`\nパスワード: ${DEMO_PASSWORD}`);
  console.log("  一般ユーザー   : shiosai@example.com");
  console.log("  メーカー1       : Farmille企業会員ID demo-maker");
  console.log("  メーカー2       : Farmille企業会員ID demo-bio");
  console.log("  運営           : admin@example.com（/admin で TOTP 登録）");
}

await main();
