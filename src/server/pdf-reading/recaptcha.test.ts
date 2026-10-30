// @vitest-environment node
import { describe, expect, it } from "vitest";

import { verifyRecaptcha } from "./recaptcha";

type SiteverifyBody = { [key: string]: boolean | number | string | string[] };

function siteverify(body: SiteverifyBody, status = 200) {
  const sent: URLSearchParams[] = [];

  const fetcher: typeof fetch = async (_url, init) => {
    sent.push(new URLSearchParams(init?.body instanceof URLSearchParams ? init.body : undefined));

    return Response.json(body, { status });
  };

  return { fetcher, sent };
}

describe("verifyRecaptcha", () => {
  it("成功・action の一致・スコア 0.5 以上のときだけ通す", async () => {
    const { fetcher, sent } = siteverify({ success: true, score: 0.5, action: "pdf_reading" });
    expect(await verifyRecaptcha("token", "secret", fetcher)).toBe(true);
    expect(sent[0]?.get("response")).toBe("token");
    expect(sent[0]?.get("secret")).toBe("secret");
  });

  it("スコアが低い・action が違う・失敗のときは断る", async () => {
    const bodies: SiteverifyBody[] = [
      { success: true, score: 0.4, action: "pdf_reading" },
      { success: true, score: 0.9, action: "login" },
      { success: true, action: "pdf_reading" },
      { success: false, "error-codes": ["timeout-or-duplicate"] },
    ];

    for (const body of bodies) {
      expect(
        await verifyRecaptcha("token", "secret", siteverify(body).fetcher),
        JSON.stringify(body),
      ).toBe(false);
    }
  });

  it("応答の形が違う・検証先がエラーのときは断る", async () => {
    expect(await verifyRecaptcha("t", "s", siteverify({ ok: true }).fetcher)).toBe(false);
    expect(await verifyRecaptcha("t", "s", siteverify({ success: true }, 500).fetcher)).toBe(false);

    const offline: typeof fetch = async () => {
      throw new TypeError("fetch failed");
    };

    expect(await verifyRecaptcha("t", "s", offline)).toBe(false);
  });
});
