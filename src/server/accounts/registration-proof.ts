import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import * as v from "valibot";

import { clientEnv, serverEnv } from "@/env";

const COOKIE_NAME = "farmille-registration";
const MAX_AGE = 3600;

const ProofSchema = v.object({
  userId: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  expires: v.number(),
});

export type RegistrationProof = v.InferOutput<typeof ProofSchema>;

function signature(body: string, secret: string) {
  return createHmac("sha256", secret).update(`farmille-registration\0${body}`).digest();
}

export function encodeRegistrationProof(proof: RegistrationProof, secret: string): string {
  const body = Buffer.from(JSON.stringify(proof)).toString("base64url");

  return `${body}.${signature(body, secret).toString("base64url")}`;
}

export function decodeRegistrationProof(stored: string, secret: string, now: number) {
  const [body, mac, extra] = stored.split(".");

  if (!body || !mac || extra !== undefined) return null;
  const expected = signature(body, secret);
  const actual = Buffer.from(mac, "base64url");

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  const parsed = v.safeParse(
    v.pipe(v.string(), v.parseJson(), ProofSchema),
    Buffer.from(body, "base64url").toString("utf8"),
  );

  if (!parsed.success || parsed.output.expires <= now) return null;

  return parsed.output;
}

/** 本人証明は登録画面だけで使い、通常のログインには使わない。 */
export async function saveRegistrationProof(userId: string, email: string) {
  const jar = await cookies();
  jar.set(
    COOKIE_NAME,
    encodeRegistrationProof(
      { userId, email, expires: Date.now() + MAX_AGE * 1000 },
      serverEnv.authEmailHookSecret,
    ),
    {
      httpOnly: true,
      secure: new URL(clientEnv.siteUrl).protocol === "https:",
      sameSite: "lax",
      path: "/signup",
      maxAge: MAX_AGE,
    },
  );
}

export async function readRegistrationProof() {
  const stored = (await cookies()).get(COOKIE_NAME)?.value;

  return stored ? decodeRegistrationProof(stored, serverEnv.authEmailHookSecret, Date.now()) : null;
}

export async function clearRegistrationProof() {
  (await cookies()).set(COOKIE_NAME, "", { path: "/signup", maxAge: 0 });
}
