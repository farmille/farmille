import { randomUUID } from "node:crypto";
import { expect, type Page, type TestInfo } from "@playwright/test";
import { createClient, type UserResponse } from "@supabase/supabase-js";
import * as v from "valibot";
import { TOTP } from "otpauth";
import type { Database } from "../../src/types/database.types";
import type { GeneralUser, SellerAccount } from "./test-data";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Account E2E requires ${name}.`);
  return value;
}

export function accountDb() {
  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (new URL(url).origin !== "http://127.0.0.1:54321") {
    throw new Error("Account fixtures may only use disposable local Supabase.");
  }
  return createClient<Database>(url, requiredEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function checkedData<T>(result: {
  data: T;
  error: { message: string } | null;
}): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null || result.data === undefined)
    throw new Error("Fixture response was empty.");
  return result.data;
}

function checkedAuthUser(result: UserResponse) {
  if (result.error) throw new Error(result.error.message);
  return result.data.user;
}

export async function promoteAdmin(user: GeneralUser): Promise<void> {
  checkedAuthUser(
    await accountDb().auth.admin.updateUserById(user.id, {
      app_metadata: { account_type: "admin" },
    }),
  );
}

export async function createDurableSeller(prefix: string): Promise<SellerAccount> {
  const loginId = `company-e2e-${randomUUID().slice(0, 8)}-${prefix}`.slice(0, 30);
  const password = "Farmille-E2E-Durable-2026!";
  const db = accountDb();
  const auth = checkedAuthUser(
    await db.auth.admin.createUser({
      email: `${loginId}@sellers.farmille.internal`,
      password,
      email_confirm: true,
      app_metadata: { account_type: "seller" },
    }),
  );
  const seller = checkedData(
    await db
      .from("seller_accounts")
      .insert({
        auth_user_id: auth.id,
        login_id: loginId,
        official_name: `E2E ${loginId}株式会社`,
        corporate_number: "1234567890123",
        contact_email: `${loginId}@example.test`,
        contact_name: "非公開 申請担当",
        contact_phone: "090-1234-5678",
        location: "東京都千代田区",
        region_scope: "全国",
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .select("id,official_name")
      .single(),
  );
  checkedAuthUser(
    await db.auth.admin.updateUserById(auth.id, {
      app_metadata: { account_type: "seller", seller_id: seller.id },
    }),
  );
  return {
    id: seller.id,
    authUserId: auth.id,
    loginId,
    officialName: seller.official_name,
    password,
  };
}

export async function createDurableAdmin(): Promise<GeneralUser> {
  const token = `company-e2e-admin-${randomUUID()}`;
  const email = `${token}@example.test`;
  const password = "Farmille-E2E-Durable-2026!";
  const user = checkedAuthUser(
    await accountDb().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { account_type: "admin" },
    }),
  );
  return { id: user.id, email, password, handle: token.slice(0, 30) };
}

export async function createDurableMaterial() {
  return checkedData(
    await accountDb()
      .from("materials")
      .insert({
        name: `E2E資材_company-e2e-${randomUUID()}`,
        manufacturer_name: "E2E申請資料メーカー",
        sales_status: "販売中",
        seller_id: null,
      })
      .select("id,name,seller_id,sales_status")
      .single(),
  );
}

export async function captureAccount(page: Page, info: TestInfo, name: string): Promise<void> {
  await expect(page.getByText("読み込んでいます", { exact: true })).toHaveCount(0);
  await info.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
}

export async function verifyExistingMfa(
  page: Page,
  secret: string,
  previousCode: string,
): Promise<void> {
  const totp = new TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret });
  await expect.poll(() => totp.generate(), { timeout: 35_000 }).not.toBe(previousCode);
  await page.getByLabel("認証コード").fill(totp.generate());
  await page.getByRole("button", { name: "2要素認証を完了する" }).click();
}

const MailList = v.object({
  messages: v.array(
    v.object({
      ID: v.string(),
      To: v.array(v.object({ Address: v.string() })),
    }),
  ),
});
const MailContent = v.object({ ID: v.string(), Text: v.string(), Subject: v.string() });

export async function localMail(
  email: string,
  contains: string,
  excludedLink = "",
  excludedMessageId = "",
) {
  accountDb();
  let found: v.InferOutput<typeof MailContent> | null = null;
  await expect
    .poll(
      async () => {
        const listResponse = await fetch("http://127.0.0.1:54324/api/v1/messages");
        if (!listResponse.ok) throw new Error(`Mailpit returned ${listResponse.status}.`);
        const list = v.parse(MailList, await listResponse.json());
        for (const mail of list.messages.filter(
          (mail) => mail.ID !== excludedMessageId && mail.To.some((to) => to.Address === email),
        )) {
          const response = await fetch(`http://127.0.0.1:54324/api/v1/message/${mail.ID}`);
          if (!response.ok) throw new Error(`Mailpit message returned ${response.status}.`);
          const content = v.parse(MailContent, await response.json());
          if (
            content.Text.includes(contains) &&
            (!excludedLink || !content.Text.includes(excludedLink))
          ) {
            found = content;
            return true;
          }
        }
        return false;
      },
      { timeout: 20_000 },
    )
    .toBe(true);
  return v.parse(MailContent, found);
}

export async function removalLink(email: string, excludedLink = ""): Promise<string> {
  const mail = await localMail(email, "/company-requests/removal/confirm#", excludedLink);
  const link = mail.Text.match(
    /http:\/\/localhost:3007\/company-requests\/removal\/confirm#[a-f0-9]{64}/,
  )?.[0];
  if (!link) throw new Error("Invitation did not contain the local confirmation link.");
  return link;
}
