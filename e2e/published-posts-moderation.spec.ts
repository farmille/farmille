import { expect, test } from "@playwright/test";
import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  createGeneralUser,
  createMaterial,
  createReview,
  createPublishedUsageReport,
  deleteAuthUsersByEmail,
  deleteMaterial,
  reviewByAuthor,
  usageReportByAuthor,
} from "./support/test-data";
import { loginAdminAndEnrollMfa, loginGeneral } from "./support/ui";

test("運営が公開済み投稿を非公開化し、本文を保持する", async ({ page, browser }) => {
  const author = await createGeneralUser("post-removal");
  const material = await createMaterial("post-removal");
  const review = await createReview({
    materialId: material.id,
    authorUserId: author.id,
    rating: 4,
    body: `運営非公開テスト口コミ${material.id}`,
  });
  const report = await createPublishedUsageReport({
    materialId: material.id,
    authorUserId: author.id,
    title: `運営非公開テストレポート${material.id}`,
    observedChange: "非公開後も本文を保存する",
  });
  try {
    await page.goto("/admin/published-posts");
    await expect(page).toHaveURL(/\/login\?/);
    await loginGeneral(page, author, "/me");
    const denied = await page.goto("/admin/published-posts");
    expect(denied?.status()).toBe(404);
    await page.goto(`/materials/${material.id}#review-${review.id}`);
    await expect(page.locator(`#review-${review.id}`)).toContainText(review.body);
    await page.context().clearCookies();
    await loginAdminAndEnrollMfa(page, E2E_ADMIN_ACCOUNTS.moderation, "/admin/published-posts");
    for (const title of [review.body, report.title]) {
      if (title === null) throw new Error("投稿タイトルがありません");
      const card = page
        .locator("section")
        .filter({ has: page.getByRole("link", { name: title, exact: true }) });
      await card.locator("summary").click();
      await card.getByRole("button", { name: "非公開にする", exact: true }).click();
      await expect(card.getByRole("checkbox")).not.toBeChecked();
      await expect(card).toBeVisible();
      await card.getByRole("checkbox").check();
      await card.getByRole("button", { name: "非公開にする", exact: true }).click();
      await expect(card).toHaveCount(0);
    }
    const savedReview = await reviewByAuthor(author.id);
    expect(savedReview?.status).toBe("hidden");
    expect(savedReview?.body).toBe(review.body);
    const savedReport = await usageReportByAuthor(author.id);
    expect(savedReport?.status).toBe("declined");
    expect(savedReport?.title).toBe(report.title);
    const anonymous = await browser.newContext();
    const publicPage = await anonymous.newPage();
    await publicPage.goto(`/materials/${material.id}`);
    await expect(publicPage.getByText(review.body, { exact: true })).toHaveCount(0);
    const hiddenReport = await publicPage.goto(`/reports/${report.id}`);
    expect(hiddenReport?.status()).toBe(404);
    await publicPage.screenshot({
      path: "/tmp/farmille-september30/moderation-local-after.png",
      fullPage: true,
    });
    await anonymous.close();
  } finally {
    await deleteMaterial(material.id);
    await deleteAuthUsersByEmail(author.email);
  }
});
