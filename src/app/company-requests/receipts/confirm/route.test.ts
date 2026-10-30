// @vitest-environment node

import { afterEach, expect, it, vi } from "vitest";
import { POST } from "./route";

afterEach(() => vi.unstubAllEnvs());

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
