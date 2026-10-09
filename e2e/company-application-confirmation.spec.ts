import { test, expect } from "@playwright/test";

test("申請用メール確認は解析を読み込まず、明示POSTだけを受け付ける", async ({
  request,
  baseURL,
}) => {
  if (!baseURL) throw new Error("E2EのbaseURLが設定されていません。");
  const response = await request.get("/company-requests/receipts/confirm");
  expect(response.status()).toBe(200);
  expect(response.headers()["referrer-policy"]).toBe("no-referrer");
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  const csp = response.headers()["content-security-policy"];
  if (!csp) throw new Error("確認ページのCSPがありません。");
  for (const directive of [
    "default-src 'none'",
    "form-action 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ])
    expect(csp).toContain(directive);
  const nonce = /script-src 'nonce-([^']+)'/.exec(csp)?.[1];
  expect(nonce).toBeTruthy();
  const html = await response.text();
  expect(html).toContain(`<script nonce="${nonce}">`);
  expect(html).not.toMatch(/<script[^>]+src=/);
  expect(html).toContain("history.replaceState");
  const forged = await request.post("/company-requests/receipts/confirm", {
    headers: { origin: "https://unrelated.example" },
    form: { token: "a".repeat(64) },
  });
  expect(forged.status()).toBe(403);
  const invalid = await request.post("/company-requests/receipts/confirm", {
    headers: { origin: baseURL },
    form: { token: "invalid" },
  });
  expect(invalid.status()).toBe(400);
});

test("no-referrerの確認フォームは同一オリジンだけを受け付ける", async ({ request }) => {
  for (const site of ["cross-site", "same-site", "none"]) {
    const response = await request.post("/company-requests/receipts/confirm", {
      headers: { origin: "null", "sec-fetch-site": site },
      form: { token: "invalid" },
    });
    expect(response.status()).toBe(403);
  }
  const sameOrigin = await request.post("/company-requests/receipts/confirm", {
    headers: { origin: "null", "sec-fetch-site": "same-origin" },
    form: { token: "invalid" },
  });
  expect(sameOrigin.status()).toBe(400);
});

test("未ログインのメーカー申請ページは戻り先を保ってログインへ案内する", async ({ request }) => {
  for (const path of [
    "/dashboard/applications",
    "/dashboard/applications/new/registration",
    "/dashboard/applications/00000000-0000-4000-8000-000000000001",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(`/sellers/login?next=${encodeURIComponent(path)}`);
  }
});
