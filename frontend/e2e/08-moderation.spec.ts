import { expect, test } from "@playwright/test";

import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  createGeneralUser,
  createMaterial,
  createPendingUsageReport,
  createReview,
  deleteAuthUsersByEmail,
  deleteMaterial,
  uniqueToken,
} from "./support/test-data";
import { loginAdminAndEnrollMfa, loginGeneral } from "./support/ui";

test("通報の resolve と対象非公開、編集局の pending 公開", async ({ page }) => {
  const author = await createGeneralUser("reported");
  const reporter = await createGeneralUser("reporter");
  const material = await createMaterial("moderation");
  const reviewBody = `E2E通報対象_${uniqueToken("review")}`;
  const reportTitle = `E2E編集局_${uniqueToken("report")}`;
  const review = await createReview({
    materialId: material.id,
    authorUserId: author.id,
    rating: 2,
    body: reviewBody,
  });
  const usageReport = await createPendingUsageReport({
    materialId: material.id,
    authorUserId: reporter.id,
    title: reportTitle,
  });

  try {
    await loginGeneral(page, reporter);
    await page.goto(`/materials/${material.id}`);
    const reviewCard = page.getByRole("article").filter({ hasText: reviewBody });
    await reviewCard.getByRole("button", { name: "通報する" }).click();
    const reportDialog = page.getByRole("dialog", { name: "このレビューを通報する" });
    await reportDialog.getByLabel("通報理由").selectOption("false_info");
    await reportDialog.getByLabel("詳細（任意）").fill("E2Eで非公開化を確認します。");
    await reportDialog.getByRole("button", { name: "通報する" }).click();
    await expect(page.getByRole("dialog", { name: "通報を受け付けました" })).toBeVisible();

    await page.context().clearCookies();
    await loginAdminAndEnrollMfa(page, E2E_ADMIN_ACCOUNTS.moderation, "/admin/reports");
    const reportRow = page.getByRole("row").filter({ hasText: reviewBody.slice(0, 32) });
    await reportRow.getByRole("button", { name: "非公開化して解決" }).click();
    await expect(reportRow).toHaveCount(0);

    await page.goto(`/materials/${material.id}`);
    await expect(page.getByText(reviewBody, { exact: true })).toHaveCount(0);

    await page.goto("/admin/usage-reports");
    await page.getByRole("link", { name: reportTitle }).click();
    await page.getByRole("button", { name: "公開する" }).click();
    await expect(page.getByText("使用レポートを公開しました。")).toBeVisible();

    await page.goto(`/reports/${usageReport.id}`);
    await expect(page.getByRole("heading", { name: reportTitle })).toBeVisible();
    await expect(page.getByText(material.name, { exact: true })).toBeVisible();
    expect(review.status).toBe("published");
  } finally {
    await deleteMaterial(material.id);
    await deleteAuthUsersByEmail(author.email);
    await deleteAuthUsersByEmail(reporter.email);
  }
});
