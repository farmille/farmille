import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import * as v from "valibot";

import { clientEnv, serverEnv } from "@/env";
import { createIsolatedAuthClient } from "@/server/supabase";
import { fail, succeed } from "@/server/result";
import { toErrorCode } from "./auth-errors";

const COOKIE_NAME = "farmille-password-recovery";
const MAX_AGE = 600;

const RecoverySessionSchema = v.object({
  access_token: v.string(),
  refresh_token: v.string(),
  link: v.string(),
  expires: v.number(),
});

function signature(body: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(`farmille-password-recovery\0${body}`).digest();
}

export function encodeRecoveryProof(
  session: v.InferOutput<typeof RecoverySessionSchema>,
  secret: string,
): string {
  const body = Buffer.from(JSON.stringify(session)).toString("base64url");

  return `${body}.${signature(body, secret).toString("base64url")}`;
}

export function decodeRecoveryProof(stored: string, link: string, secret: string, now: number) {
  const [body, mac, extra] = stored.split(".");

  if (!body || !mac || extra !== undefined) return null;
  const expected = signature(body, secret);
  const actual = Buffer.from(mac, "base64url");

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  const parsed = v.safeParse(
    v.pipe(v.string(), v.parseJson(), RecoverySessionSchema),
    Buffer.from(body, "base64url").toString("utf8"),
  );

  if (!parsed.success || parsed.output.link !== link || parsed.output.expires <= now) return null;

  return parsed.output;
}

/** メール検証済みのセッションだけを、通常ログインと分離した署名付きcookieで保持する。 */
export async function openRecoverySession(tokenHash: string) {
  const client = createIsolatedAuthClient();
  const jar = await cookies();
  const link = createHash("sha256").update(tokenHash).digest("hex");
  const stored = jar.get(COOKIE_NAME)?.value;

  if (stored) {
    const session = decodeRecoveryProof(stored, link, serverEnv.authEmailHookSecret, Date.now());

    if (session) {
      const restored = await client.auth.setSession(session);

      if (restored.error) return fail(toErrorCode(restored.error, "restoreRecovery"));

      return succeed(client);
    }
  }

  const verified = await client.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });

  if (verified.error) return fail(toErrorCode(verified.error, "verifyPasswordRecovery"));

  if (!verified.data.session) return fail("expired_link");

  const proof = encodeRecoveryProof(
    {
      access_token: verified.data.session.access_token,
      refresh_token: verified.data.session.refresh_token,
      link,
      expires: Date.now() + MAX_AGE * 1000,
    },
    serverEnv.authEmailHookSecret,
  );

  jar.set(COOKIE_NAME, proof, {
    httpOnly: true,
    secure: new URL(clientEnv.siteUrl).protocol === "https:",
    sameSite: "strict",
    path: "/password-reset/update",
    maxAge: MAX_AGE,
  });

  return succeed(client);
}

export async function clearRecoverySession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { path: "/password-reset/update", maxAge: 0 });
}
