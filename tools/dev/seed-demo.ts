// ローカル検証用：デモアカウントのパスワードを既知の値に揃える。
//
// !!! リモート（Supabase クラウドの dev / 本番プロジェクト）では実行しない !!!
// 接続先がローカルのホストでない場合は何もせず異常終了する。
//
// 使い方:
//   node --env-file=.env.local tools/dev/seed-demo.ts
//
// 画面検証用のデータ（審査待ちの申請・編集局待ちのレポート・未処理の通報）は
// tools/dev/seed-demo.sql を psql で流す。両方を実行すると全画面が空でない状態になる。

const DEMO_PASSWORD = "Farmille#Local2026";

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

  const body = (await res.json()) as { users?: AuthUser[] };
  return body.users ?? [];
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
  console.log("  出品者(メーカー): ログインID demo-maker");
  console.log("  出品者(JA)     : ログインID demo-ja");
  console.log("  運営           : admin@example.com（/admin で TOTP 登録）");
}

await main();
