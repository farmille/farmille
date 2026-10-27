import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as v from "valibot";
import { TOTP } from "otpauth";

import type { Database } from "../src/types/database.types";
import {
  createGeneralUser,
  createApprovedSeller,
  deleteAuthUser,
  cleanupSellerByLoginId,
} from "./support/test-data";
import { loginGeneral, loginSeller, loginAdminAndEnrollMfa } from "./support/ui";
import { captureScreenFlow } from "./support/screen-flow";

test.use({ trace: "off", video: "off", screenshot: "off" });

const MailListSchema = v.object({
  messages: v.array(v.object({ ID: v.string(), To: v.array(v.object({ Address: v.string() })) })),
});
const MailSchema = v.object({ Text: v.string() });

async function recoveryLink(email: string): Promise<string> {
  let id = "";
  await expect
    .poll(
      async () => {
        const response = await fetch("http://127.0.0.1:54324/api/v1/messages");
        const data = v.parse(MailListSchema, await response.json());
        id = data.messages.find((mail) => mail.To.some((to) => to.Address === email))?.ID ?? "";
        return id;
      },
      { timeout: 20_000 },
    )
    .not.toBe("");
  const response = await fetch(`http://127.0.0.1:54324/api/v1/message/${id}`);
  const data = v.parse(MailSchema, await response.json());
  const link = data.Text.match(
    /http:\/\/localhost:3007\/password-reset\/update\?token_hash=[a-zA-Z0-9_-]+/,
  )?.[0];
  if (!link) throw new Error("再設定メールにアプリの再設定リンクがありません。");
  return link;
}

for (const role of ["general", "seller", "admin"] as const) {
  test(`${role}の現在パスワード変更とメールによる再設定`, async ({ page, browser }) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (url !== "http://127.0.0.1:54321" || !secret)
      throw new Error("ローカル検証環境だけで実行できます。");
    const db = createClient<Database>(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const general = await createGeneralUser(`password-${role}`);
    const seller = role === "seller" ? await createApprovedSeller("password") : null;
    const authId = seller?.authUserId ?? general.id;
    const email = seller ? `${seller.loginId}@example.test` : general.email;
    const original = seller?.password ?? general.password;
    const changed = `Changed-${randomUUID()}aA!1`;
    const recovered = `Recovered-${randomUUID()}aA!1`;
    let totpSecret = "";
    try {
      if (role === "admin") {
        const result = await db.auth.admin.updateUserById(authId, {
          app_metadata: { account_type: "admin" },
        });
        if (result.error) throw result.error;
        totpSecret = await loginAdminAndEnrollMfa(page, general, "/admin");
      } else if (seller) await loginSeller(page, seller);
      else await loginGeneral(page, general, "/me");
      if (process.env.CAPTURE_SCREEN_FLOW === "1")
        await captureScreenFlow(
          page,
          role === "admin" ? "53-admin-home.png" : seller ? "10-dashboard.png" : "09-mypage.png",
        );
      // 一般会員はマイページの「登録情報」からパスワードの変更へ進む
      if (role === "general")
        await page.getByRole("link", { name: "登録情報", exact: true }).click();
      await page.getByRole("link", { name: "パスワードを変更", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "パスワードの変更", exact: true }),
      ).toBeVisible();
      if (process.env.CAPTURE_SCREEN_FLOW === "1")
        await captureScreenFlow(page, `62-password-change-${role}.png`);
      await page.getByLabel(/^現在のパスワード/).fill("Wrong-password!");
      await page.getByLabel(/^新しいパスワード[^（]*$/).fill(changed);
      await page.getByLabel(/^新しいパスワード（確認）/).fill(changed);
      await page.getByRole("button", { name: "パスワードを変更する" }).click();
      await expect(
        page.getByText("現在のパスワードが正しくありません。", { exact: true }),
      ).toBeVisible();
      await page.getByLabel(/^現在のパスワード/).fill(original);
      await page.getByLabel(/^新しいパスワード[^（]*$/).fill(changed);
      await page.getByLabel(/^新しいパスワード（確認）/).fill(changed);
      await page.getByRole("button", { name: "パスワードを変更する" }).click();
      await expect(
        page.getByText("パスワードを変更しました。新しいパスワードでログインしてください。", {
          exact: true,
        }),
      ).toBeVisible();
      const loginEmail = seller ? `${seller.loginId}@sellers.farmille.internal` : email;
      const auth = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "", {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      expect(
        (await auth.auth.signInWithPassword({ email: loginEmail, password: original })).error,
      ).not.toBeNull();
      expect(
        (await auth.auth.signInWithPassword({ email: loginEmail, password: changed })).error,
      ).toBeNull();
      await auth.auth.signOut({ scope: "local" });

      await page.goto(seller ? "/sellers/password-reset" : "/password-reset");
      if (seller) {
        if (process.env.CAPTURE_SCREEN_FLOW === "1")
          await captureScreenFlow(page, "63-seller-password-reset.png");
        await page.getByLabel(/^Farmille企業会員ID/).fill(seller.loginId);
        await page.getByLabel("登録済みの連絡先メールアドレス").fill(email);
        await page.getByRole("button", { name: "再設定メールを送信", exact: true }).click();
      } else {
        await page.getByLabel(/^メールアドレス/).fill(email);
        await page.getByRole("button", { name: "再設定メールを送る", exact: true }).click();
      }
      await expect(page.getByText(/登録情報が一致する場合/)).toBeVisible();
      const link = await recoveryLink(email);
      // メールを別のブラウザで開いても、元ブラウザのPKCE cookieに依存しない。
      const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
      const recovery = await context.newPage();
      try {
        await recovery.goto(link);
        await expect(recovery.getByLabel(/^新しいパスワード[^（]*$/)).toBeVisible();
        if (process.env.CAPTURE_SCREEN_FLOW === "1" && role === "general")
          await captureScreenFlow(recovery, "45-password-update.png");
        await recovery.getByLabel(/^新しいパスワード[^（]*$/).fill(recovered);
        await recovery.getByLabel(/^新しいパスワード（確認）/).fill(recovered);
        await recovery.getByRole("button", { name: "パスワードを変更する" }).click();
        if (role === "admin") {
          await expect(
            recovery.getByText(
              "認証アプリに表示された最新の6桁のコードを入力して、もう一度送信してください。",
              { exact: true },
            ),
          ).toBeVisible();
          const totp = new TOTP({ algorithm: "SHA1", digits: 6, period: 30, secret: totpSecret });
          const previousCode = totp.generate();
          await expect.poll(() => totp.generate(), { timeout: 35_000 }).not.toBe(previousCode);
          await recovery.getByLabel(/^新しいパスワード[^（]*$/).fill(recovered);
          await recovery.getByLabel(/^新しいパスワード（確認）/).fill(recovered);
          await recovery.getByLabel("2要素認証コード").fill(totp.generate());
          await recovery.getByRole("button", { name: "パスワードを変更する" }).click();
        }
        await expect(
          recovery.getByText("パスワードを変更しました。", { exact: true }),
        ).toBeVisible();
        expect(
          (await auth.auth.signInWithPassword({ email: loginEmail, password: changed })).error,
        ).not.toBeNull();
        expect(
          (await auth.auth.signInWithPassword({ email: loginEmail, password: recovered })).error,
        ).toBeNull();
        if (role === "admin") {
          const factors = await db.auth.admin.mfa.listFactors({ userId: authId });
          expect(factors.data?.factors.some((factor) => factor.status === "verified")).toBe(true);
        }
        await recovery.goto(link);
        await recovery.getByLabel(/^新しいパスワード[^（]*$/).fill(changed);
        await recovery.getByLabel(/^新しいパスワード（確認）/).fill(changed);
        await recovery.getByRole("button", { name: "パスワードを変更する" }).click();
        await expect(
          recovery.getByText(
            "リンクが無効か、有効期限が切れています。もう一度やり直してください。",
            { exact: true },
          ),
        ).toBeVisible();
      } finally {
        await context.close();
      }
    } finally {
      if (seller) await cleanupSellerByLoginId(seller.loginId);
      await deleteAuthUser(general.id);
    }
  });
}
