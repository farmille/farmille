import { randomUUID } from "node:crypto";
import { expect, test, type Page, type Request } from "@playwright/test";
import { createGeneralUser, deleteAuthUser } from "./support/test-data";
import { loginAdminAndEnrollMfa, loginGeneral, loginSeller } from "./support/ui";
import {
  accountDb,
  captureAccount,
  checkedData,
  createDurableMaterial,
  createDurableSeller,
  localMail,
  promoteAdmin,
  removalLink,
} from "./support/account-flows";

async function fillCompany(page: Page, prefix = ""): Promise<void> {
  await page.locator(`input[name="${prefix}corporateNumber"]`).fill("1234567890123");
  await page.locator(`input[name="${prefix}department"]`).fill("非公開 営業企画部");
  await page.locator(`input[name="${prefix}phone"]`).fill("090-1234-5678");
}

async function verifyRemovalEmail(page: Page, company: string, email: string): Promise<string> {
  await page.goto("/company-requests/removal");
  await page.getByLabel("法人名（必須）", { exact: true }).fill(company);
  await page.getByLabel("担当者名（必須）", { exact: true }).fill("非公開 申請担当");
  await page.getByLabel("担当者メールアドレス（必須）", { exact: true }).fill(email);
  await page.getByRole("button", { name: "送信して申請フォームを受け取る", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "申請フォームのご案内をお送りしました" }),
  ).toBeVisible();
  const link = await removalLink(email);
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "申請用メールアドレスの確認" })).toBeVisible();
  await expect(page).toHaveURL(/\/company-requests\/removal\/confirm$/);
  const before = await page.context().cookies();
  expect(before.some((cookie) => cookie.name === "farmille_application_access")).toBe(false);
  await page.getByRole("button", { name: "メールアドレスを確認する", exact: true }).click();
  await expect(page).toHaveURL(/\/company-requests\/removal\/form$/);
  const cookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "farmille_application_access",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Strict");
  return link;
}

for (const kind of ["registration", "transfer_out", "transfer_in", "removal"] as const) {
  test(`フォーム${{ registration: "A", transfer_out: "B", transfer_in: "C", removal: "D" }[kind]} 複数資材の申請・受付票・非公開資料・控え再送・運営閲覧`, async ({
    page,
    browser,
  }, info) => {
    test.setTimeout(180_000);
    const db = accountDb();
    const seller = await createDurableSeller(kind);
    const destination = kind === "transfer_out" ? await createDurableSeller("destination") : null;
    const first = await createDurableMaterial(kind === "transfer_out" ? seller.id : null);
    const second = await createDurableMaterial(kind === "transfer_out" ? seller.id : null);
    const operatorAccount = await createGeneralUser(`company-admin-${kind}`);
    const outsider = await createGeneralUser(`company-outsider-${kind}`);
    const otherSeller = await createDurableSeller("other");
    const operatorContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const outsiderContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const operator = await operatorContext.newPage();
    const visitor = await outsiderContext.newPage();
    const company = seller.officialName;
    const recipient = `${seller.loginId}@example.test`;
    const signer = `company-e2e-signer-${randomUUID().slice(0, 8)}`;
    const newName = `新規掲載_${seller.loginId}`;
    const submitted: Request[] = [];
    let invitationLink = "";
    const receiptPath =
      kind === "removal" ? "/company-requests/receipts/" : "/dashboard/applications/";
    try {
      if (kind === "transfer_out") {
        for (const material of [first, second]) {
          checkedData(
            await db
              .from("material_editor_grants")
              .insert({
                material_id: material.id,
                seller_id: seller.id,
                document_reference: `E2E ${seller.loginId}`,
                granted_by: seller.authUserId,
              })
              .select()
              .single(),
          );
        }
      }
      if (kind === "removal") invitationLink = await verifyRemovalEmail(page, company, recipient);
      else {
        await loginSeller(page, seller);
        await page.goto("/dashboard/applications");
        await page.locator(`a[href="/dashboard/applications/new/${kind}"]`).click();
        await expect(page).toHaveURL(new RegExp(`/dashboard/applications/new/${kind}$`));
        await fillCompany(page);
      }
      await page.locator('input[name="department"]').fill("非公開 営業企画部");
      await page.locator('input[name="phone"]').fill("090-1234-5678");
      if (kind === "removal")
        await page.getByLabel("会社概要ページURL（必須）").fill("https://example.test/company");
      if (destination) {
        await page.locator('input[name="destination.companyName"]').fill(destination.officialName);
        await page.locator('input[name="destination.accountId"]').fill(destination.loginId);
        await page.locator('input[name="destination.contactName"]').fill("非公開 移行先担当");
        await page
          .locator('input[name="destination.email"]')
          .fill(`${destination.loginId}@example.test`);
        await fillCompany(page, "destination.");
      }
      if (kind === "transfer_in")
        await page.getByLabel("申請の経緯（必須）").fill("事業譲渡により資材事業を承継しました。");
      await page.getByRole("button", { name: "資材を追加", exact: true }).click();
      for (const [index, material] of [first, second].entries()) {
        const row = page.getByRole("region", { name: `資材 ${index + 1}`, exact: true });
        await row
          .getByLabel("資材名（必須）")
          .fill(kind === "registration" && index === 0 ? newName : material.name);
        if (kind === "registration" && index === 1)
          await row.getByLabel("申請内容（必須）").selectOption("existing");
        if (kind !== "registration" || index === 1)
          await row
            .getByLabel("FarmilleページURL（必須）")
            .fill(`http://localhost:3007/materials/${material.id}`);
        if (kind === "registration" || kind === "removal") {
          await row.getByRole("checkbox", { name: "製造元", exact: true }).check();
          await row.getByRole("checkbox", { name: "販売元", exact: true }).check();
        }
        if (kind === "transfer_in") {
          await row.getByLabel("現在の資材オーナー企業の法人名（必須）").fill("承継元企業株式会社");
          await row.getByLabel("その他、分かる情報（任意）").fill("公開資料に記載された所在地");
        }
        if (kind === "removal") {
          await row
            .getByLabel("申請種別（必須）")
            .selectOption(index === 0 ? "discontinued" : "hidden");
          await row
            .getByLabel("申請理由（必須）")
            .fill(index === 0 ? "2026年9月末に製造終了" : "関係会社協議のため非表示を希望");
          await row
            .getByRole("radio", { name: index === 0 ? "開示してよい" : /^開示を希望しない/ })
            .check();
        }
        if (index === 1)
          await row
            .getByLabel("パッケージが確認できる製品ページURL", { exact: true })
            .fill("https://example.test/package-second");
      }
      await page.getByLabel("署名・担当者名（必須）").fill(signer);
      const submit = page.getByRole("button", { name: "内容を確認して申請する", exact: true });
      await submit.click();
      await expect(page).toHaveURL(
        kind === "removal" ? /\/removal\/form$/ : new RegExp(`/new/${kind}$`),
      );
      const checks = page.locator('input[name^="consent."]');
      for (const check of await checks.all()) await check.check();
      await submit.click();
      await expect(page.getByRole("alert")).toContainText("必須資料もご確認ください。");
      await expect(page.getByLabel("署名・担当者名（必須）")).toHaveValue(signer);
      const firstRow = page.getByRole("region", { name: "資材 1", exact: true });
      const upload = firstRow.getByLabel("パッケージ・ラベルの資料", { exact: false });
      await upload.setInputFiles({
        name: "invalid.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("invalid"),
      });
      await expect(firstRow.getByRole("alert")).toContainText("JPG・PNG・PDFを、1ファイル10MB以内");
      await upload.setInputFiles({
        name: "oversized.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
      });
      await expect(firstRow.getByRole("alert")).toContainText("JPG・PNG・PDFを、1ファイル10MB以内");
      await upload.setInputFiles(Array.from({ length: 6 }, () => "e2e/fixtures/report.png"));
      await expect(firstRow.getByRole("alert")).toContainText(
        "この添付欄に登録できる資料は5件までです。",
      );
      await upload.setInputFiles({
        name: "spoofed.png",
        mimeType: "image/png",
        buffer: Buffer.from("not-a-png"),
      });
      await expect(firstRow.getByRole("alert")).toContainText("資料の形式を確認できませんでした。");
      await expect(firstRow.getByText("spoofed.png（未完了）", { exact: true })).toBeVisible();
      await firstRow.getByRole("button", { name: "削除", exact: true }).click();
      await expect(firstRow.getByText("spoofed.png（未完了）", { exact: true })).toHaveCount(0);
      await upload.setInputFiles("e2e/fixtures/report.png");
      await expect(firstRow.getByText("report.png（登録済み）", { exact: true })).toBeVisible();
      await captureAccount(page, info, `company-${kind}-form-375`);
      page.on("request", (request) => {
        if (request.method() === "POST" && request.postData()?.includes(signer))
          submitted.push(request);
      });
      await submit.click();
      await expect(page).toHaveURL(
        (url) => url.pathname.startsWith(receiptPath) && !url.pathname.includes("/new/"),
        { timeout: 30_000 },
      );
      const applicationId = page.url().split("/").at(-1);
      if (!applicationId) throw new Error("Receipt URL has no application ID.");
      const application = checkedData(
        await db.from("company_applications").select("*").eq("id", applicationId).single(),
      );
      expect(application.kind).toBe(kind);
      expect(application.company_name).toBe(company);
      expect(application.signer_name).toBe(signer);
      const receipt = page.locator("article.application-receipt");
      await expect(receipt).toContainText(`受付番号：${application.receipt_number}`);
      await expect(receipt).toContainText(
        `対象資材 1：${kind === "registration" ? newName : first.name}`,
      );
      await expect(receipt).toContainText(`対象資材 2：${second.name}`);
      await expect(receipt).toContainText(`控えメール送信先：${recipient}`);
      await expect(receipt).toContainText("非公開 営業企画部");
      await expect(receipt).toContainText(`署名：${signer}`);
      if (kind === "registration") {
        await expect(receipt).toContainText("資材情報の新規掲載");
        await expect(receipt).toContainText("掲載済み資材の資材オーナー権限");
      } else if (kind === "transfer_out" && destination)
        await expect(receipt).toContainText(destination.loginId);
      else if (kind === "transfer_in")
        await expect(receipt).toContainText("事業譲渡により資材事業を承継しました。");
      else if (kind === "removal") {
        await expect(receipt).toContainText("終売・廃盤の表示");
        await expect(receipt).toContainText("資材ページの非表示");
        await expect(receipt).toContainText("理由の開示：開示してよい");
        await expect(receipt).toContainText("理由の開示：開示を希望しない");
      }
      const originalRequest = submitted[0];
      if (!originalRequest) throw new Error("Submission action request was not observed.");
      const originalBody = originalRequest.postData();
      if (!originalBody) throw new Error("Submission body was empty.");
      const actionHeaders = await originalRequest.allHeaders();
      delete actionHeaders["content-length"];
      const replay = await page.request.post(originalRequest.url(), {
        headers: actionHeaders,
        data: originalBody,
      });
      expect(replay.status()).toBe(200);
      expect(await replay.text()).toContain('"ok":true');
      const conflict = await page.request.post(originalRequest.url(), {
        headers: actionHeaders,
        data: originalBody.replaceAll(signer, `${signer}-changed`),
      });
      expect(await conflict.text()).toContain('"error":"conflict"');
      expect(
        checkedData(await db.from("company_applications").select("id").eq("id", applicationId)),
      ).toHaveLength(1);
      const download = receipt.getByRole("link", { name: "report.pngをダウンロード", exact: true });
      const evidenceHref = await download.getAttribute("href");
      if (!evidenceHref) throw new Error("Receipt has no evidence download.");
      const sealed = await page.request.get(evidenceHref, { maxRedirects: 0 });
      expect(sealed.status()).toBe(302);
      expect(sealed.headers()["cache-control"]).toBe("no-store");
      const signedUrl = sealed.headers().location;
      if (!signedUrl) throw new Error("Evidence response did not contain its signed URL.");
      const file = await page.request.get(signedUrl);
      expect(file.status()).toBe(200);
      expect(file.headers()["content-type"]).toContain("image/png");
      const privateFile = await outsiderContext.request.get(evidenceHref, { maxRedirects: 0 });
      expect(privateFile.status()).toBe(kind === "removal" ? 400 : 401);
      await loginGeneral(visitor, outsider);
      expect((await outsiderContext.request.get(evidenceHref, { maxRedirects: 0 })).status()).toBe(
        kind === "removal" ? 400 : 403,
      );
      await outsiderContext.clearCookies();
      await loginSeller(visitor, otherSeller);
      expect((await outsiderContext.request.get(evidenceHref, { maxRedirects: 0 })).status()).toBe(
        kind === "removal" ? 400 : 403,
      );
      await visitor.goto(
        kind === "removal"
          ? `/company-requests/receipts/${applicationId}`
          : `/dashboard/applications/${applicationId}`,
      );
      expect(await visitor.locator("main").innerText()).not.toContain(signer);
      const publicMaterial = checkedData(
        await db.from("materials").select("seller_id,sales_status").eq("id", first.id).single(),
      );
      expect(publicMaterial).toEqual({ seller_id: first.seller_id, sales_status: "販売中" });
      await visitor.goto(`/materials/${first.id}`);
      expect(await visitor.content()).not.toContain("非公開 営業企画部");
      expect(await visitor.content()).not.toContain(recipient);
      const mail = await localMail(recipient, signer);
      expect(mail.Text).toContain(`受付番号：${application.receipt_number}`);
      expect(mail.Text).toContain(second.name);
      if (destination) {
        const delivery = checkedData(
          await db
            .from("company_application_mail_deliveries")
            .select("recipient")
            .eq("application_id", applicationId)
            .single(),
        );
        expect(delivery.recipient).toBe(recipient);
      }
      const beforeRetry = checkedData(
        await db
          .from("company_application_mail_deliveries")
          .select("attempts")
          .eq("application_id", applicationId)
          .single(),
      );
      checkedData(
        await db
          .from("company_application_mail_deliveries")
          .update({ recipient: "", sent_at: null, claimed_at: null, last_error_code: null })
          .eq("application_id", applicationId)
          .select()
          .single(),
      );
      await page.reload();
      await expect(
        page.getByRole("status").filter({ hasText: "控えメールは未送信" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "控えメールを再送", exact: true }).click();
      await expect
        .poll(
          async () =>
            checkedData(
              await db
                .from("company_application_mail_deliveries")
                .select("last_error_code")
                .eq("application_id", applicationId)
                .single(),
            ).last_error_code,
        )
        .toBe("smtp_failed");
      await expect(
        page.getByRole("button", { name: "控えメールを再送", exact: true }),
      ).toBeEnabled();
      await expect(receipt).toContainText(`受付番号：${application.receipt_number}`);
      await expect(receipt).toContainText(signer);
      const failedDelivery = checkedData(
        await db
          .from("company_application_mail_deliveries")
          .select("attempts,sent_at,claimed_at")
          .eq("application_id", applicationId)
          .single(),
      );
      expect(failedDelivery.attempts).toBe(beforeRetry.attempts + 1);
      expect(failedDelivery.sent_at).toBeNull();
      expect(failedDelivery.claimed_at).toBeNull();
      checkedData(
        await db
          .from("company_application_mail_deliveries")
          .update({ recipient })
          .eq("application_id", applicationId)
          .select()
          .single(),
      );
      await page.getByRole("button", { name: "控えメールを再送", exact: true }).click();
      await expect(
        page.getByRole("status").filter({ hasText: "控えメールを送信しました。" }),
      ).toBeVisible();
      const afterRetry = checkedData(
        await db
          .from("company_application_mail_deliveries")
          .select("attempts,sent_at,last_error_code")
          .eq("application_id", applicationId)
          .single(),
      );
      expect(afterRetry.attempts).toBe(beforeRetry.attempts + 2);
      expect(afterRetry.sent_at).not.toBeNull();
      expect(afterRetry.last_error_code).toBeNull();
      const retriedMail = await localMail(recipient, signer, "", mail.ID);
      expect(retriedMail.Text).toContain(`受付番号：${application.receipt_number}`);
      await captureAccount(page, info, `company-${kind}-receipt-375`);
      await page.emulateMedia({ media: "print" });
      await expect(page.getByRole("button", { name: "受付票を印刷・PDF保存" })).toBeHidden();
      await expect(receipt).toContainText(signer);
      await page.emulateMedia({ media: "screen" });
      await promoteAdmin(operatorAccount);
      await operator.goto("/login?next=%2Fadmin%2Fcompany-applications");
      await operator.getByLabel("メールアドレス").fill(operatorAccount.email);
      await operator.getByLabel("パスワード").fill(operatorAccount.password);
      await operator.getByRole("button", { name: "ログインする", exact: true }).click();
      await expect(operator).toHaveURL(/\/admin\/mfa\?/);
      expect((await operatorContext.request.get(evidenceHref, { maxRedirects: 0 })).status()).toBe(
        kind === "removal" ? 400 : 403,
      );
      await operatorContext.clearCookies();
      await loginAdminAndEnrollMfa(operator, operatorAccount, "/admin/company-applications");
      await operator.locator(`a[href="/admin/company-applications/${applicationId}"]`).click();
      await expect(operator.locator("article.application-receipt")).toContainText(signer);
      expect((await operatorContext.request.get(evidenceHref, { maxRedirects: 0 })).status()).toBe(
        302,
      );
      await captureAccount(operator, info, `company-${kind}-admin-375`);
      if (kind === "removal") {
        const accessId = application.access_id;
        if (!accessId) throw new Error("D receipt has no verified access record.");
        checkedData(
          await db
            .from("company_application_access")
            .update({ session_expires_at: new Date(Date.now() - 1_000).toISOString() })
            .eq("id", accessId)
            .select()
            .single(),
        );
        expect((await page.request.get(evidenceHref, { maxRedirects: 0 })).status()).toBe(400);
        await page.goto(`/company-requests/receipts/${applicationId}`);
        await expect(
          page.getByRole("banner").getByText("申請ページを開けませんでした", { exact: true }),
        ).toBeVisible();
        await page.context().clearCookies();
        await page.goto("/company-requests/receipts");
        await page.getByLabel("受付番号", { exact: true }).fill(String(application.receipt_number));
        await page.getByLabel("担当者メールアドレス（必須）", { exact: true }).fill(recipient);
        await page.getByRole("button", { name: "確認メールを送信", exact: true }).click();
        await expect(page.getByRole("status")).toContainText(
          "受付番号とメールアドレスが一致する場合",
        );
        const renewal = await removalLink(recipient, invitationLink);
        await page.goto(renewal);
        await page.getByRole("button", { name: "メールアドレスを確認する", exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`/company-requests/receipts/${applicationId}$`));
        await expect(page.locator("article.application-receipt")).toContainText(signer);
      } else {
        checkedData(
          await db
            .from("seller_accounts")
            .update({ official_name: `${company}変更後` })
            .eq("id", seller.id)
            .select()
            .single(),
        );
        await page.reload();
        await expect(receipt).toContainText(`法人名：${company}\n`);
        expect(await receipt.innerText()).not.toContain(`${company}変更後`);
        await page.goto("/dashboard/applications");
        await expect(
          page.locator(`a[href="/dashboard/applications/${applicationId}"]`),
        ).toContainText(`受付番号 ${application.receipt_number}`);
      }
    } finally {
      await operatorContext.close();
      await outsiderContext.close();
      await deleteAuthUser(operatorAccount.id);
      await deleteAuthUser(outsider.id);
    }
  });
}

test("Dの未確認・期限切れ・確認リンク再使用の拒否と入力破棄", async ({ page }, info) => {
  const email = `company-e2e-removal-${randomUUID()}@example.test`;
  const db = accountDb();
  await page.goto("/company-requests/removal/form");
  await expect(
    page.getByRole("banner").getByText("申請ページを開けませんでした", { exact: true }),
  ).toBeVisible();
  const confirmation = await verifyRemovalEmail(page, "E2E 確認専用株式会社", email);
  await page.getByLabel("部署名（必須・非公開）").fill("破棄する部署");
  await page
    .getByRole("region", { name: "資材 1", exact: true })
    .getByLabel("パッケージ・ラベルの資料", { exact: false })
    .setInputFiles("e2e/fixtures/report.png");
  await expect(page.getByText("report.png（登録済み）", { exact: true })).toBeVisible();
  page.once("dialog", (dialog) => dialog.dismiss());
  await page.getByRole("button", { name: "入力と添付を破棄して最初から入力" }).click();
  await expect(page.getByLabel("部署名（必須・非公開）")).toHaveValue("破棄する部署");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "入力と添付を破棄して最初から入力" }).click();
  await expect(page.getByLabel("部署名（必須・非公開）")).toHaveValue("");
  await expect(page.getByText("report.png（登録済み）", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("担当者メールアドレス（必須・非公開）")).toHaveValue(email);
  await captureAccount(page, info, "company-removal-restarted-375");
  await page.goto(confirmation);
  await page.getByRole("button", { name: "メールアドレスを確認する", exact: true }).click();
  await expect(page.getByText(/確認リンクが無効か、有効期限が切れています。/)).toBeVisible();
  await page.context().clearCookies();
  const expiredEmail = `company-e2e-expired-${randomUUID()}@example.test`;
  await page.goto("/company-requests/removal");
  await page.getByLabel("法人名（必須）", { exact: true }).fill("E2E 期限切れ株式会社");
  await page.getByLabel("担当者名（必須）", { exact: true }).fill("期限切れ担当");
  await page.getByLabel("担当者メールアドレス（必須）", { exact: true }).fill(expiredEmail);
  await page.getByRole("button", { name: "送信して申請フォームを受け取る", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "申請フォームのご案内をお送りしました" }),
  ).toBeVisible();
  const expired = await removalLink(expiredEmail);
  checkedData(
    await db
      .from("company_application_access")
      .update({ token_expires_at: new Date(Date.now() - 1_000).toISOString() })
      .eq("email", expiredEmail)
      .select()
      .single(),
  );
  await page.goto(expired);
  await page.getByRole("button", { name: "メールアドレスを確認する", exact: true }).click();
  await expect(page.getByText(/確認リンクが無効か、有効期限が切れています。/)).toBeVisible();
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === "farmille_application_access",
    ),
  ).toBe(false);
});
