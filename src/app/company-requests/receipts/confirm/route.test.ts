// @vitest-environment node

import { afterEach, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

afterEach(() => vi.unstubAllEnvs());

it("確認ページはnonce付きscriptだけを許し、トークンを履歴から消す", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  const csp = response.headers.get("content-security-policy");
  expect(csp).toContain("default-src 'none'");
  for (const directive of ["form-action 'self'", "base-uri 'none'", "frame-ancestors 'none'"])
    expect(csp).toContain(directive);
  const nonce = /script-src 'nonce-([^']+)'/.exec(csp ?? "")?.[1];
  expect(nonce).toBeTruthy();
  const html = await response.text();
  expect(html).toContain(`<script nonce="${nonce}">`);
  expect(html).not.toMatch(/<script[^>]+src=/);
  expect(html).toContain("location.hash.slice(1)");
  expect(html).toContain("history.replaceState");
});

it("異なる送信元を拒否し、no-referrerでも同一オリジンのフォームだけ受け付ける", async () => {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.farmille.com");
  for (const [origin, site, status] of [
    ["https://unrelated.example", "cross-site", 403],
    ["null", "cross-site", 403],
    ["null", "same-site", 403],
    ["null", "none", 403],
    ["null", "same-origin", 400],
    ["https://www.farmille.com", "same-origin", 400],
  ] as const) {
    const request = new Request("https://www.farmille.com/company-requests/receipts/confirm", {
      method: "POST",
      headers: { origin, "sec-fetch-site": site },
      body: new URLSearchParams({ token: "invalid" }),
    });
    expect((await POST(request)).status).toBe(status);
  }
});
