import { expect } from "e2e";
import {
  createGeneralUser,
  createReview,
  deleteAuthUsersByEmail,
  getMaterial,
  helpfulVoteCount,
  reviewByAuthor,
} from "../../e2e/support/test-data";
import { materialTest } from "../support/fixtures";
import { loginMember } from "../support/ui";

materialTest(
  "口コミを投稿、編集、削除して一覧と評価集計に反映する",
  async ({ app, screen, browser, member, material }) => {
    const body = `E2E口コミ_${member.id}`;
    const edited = `${body}_更新`;
    await loginMember(app, screen, browser, member, `/materials/${material.id}/review/new`);
    await screen.getByRole("textbox", "作目").fill("トマト");
    await screen.getByRole("button", "トマトを選択").tap();
    await screen.getByRole("radio", "4").check();
    await screen.getByRole("textbox", "感想口コミ本文 必須").fill(body);
    await screen.getByRole("checkbox", /実際に使用した感想を、使用条件や感じた変化/).check();
    await screen.getByRole("button", "投稿する").tap();
    await expect(browser).toHaveURL(`/materials/${material.id}?review=posted#reviews-heading`);
    await expect(screen.getByText(body)).toBeVisible();
    await expect.poll(async () => (await getMaterial(material.id)).review_count).toBe(1);
    await expect.poll(async () => (await getMaterial(material.id)).avg_rating).toBe(4);
    await screen.getByRole("article").filter({ hasText: body }).getByRole("link", "編集").tap();
    await screen.getByRole("radio", "5").check();
    await screen.getByRole("textbox", "感想口コミ本文 必須").fill(edited);
    await screen.getByRole("button", "変更を保存する").tap();
    await expect(screen.getByText(edited)).toBeVisible();
    await expect.poll(async () => (await getMaterial(material.id)).avg_rating).toBe(5);
    await screen.getByRole("article").filter({ hasText: edited }).getByRole("button", "削除").tap();
    await screen.getByRole("dialog").getByRole("button", "削除する").tap();
    await expect(screen.getByText(edited)).toHaveCount(0);
    await expect.poll(async () => await reviewByAuthor(member.id)).toBeNull();
    await expect.poll(async () => (await getMaterial(material.id)).review_count).toBe(0);
  },
);

materialTest(
  "別会員の口コミに参考になったを付けて再読込後に解除する",
  async ({ app, screen, browser, member, material }) => {
    const author = await createGeneralUser("army-review-author");
    const body = `E2E参考_${author.id}`;
    try {
      await createReview({ materialId: material.id, authorUserId: author.id, rating: 4, body });
      await loginMember(app, screen, browser, member, `/materials/${material.id}`);
      const article = screen.getByRole("article").filter({ hasText: body });
      await expect(article.getByRole("link", "編集")).toHaveCount(0);
      const helpful = article.getByRole("button", /参考になった/);
      await helpful.tap();
      await expect(helpful).toHaveAttribute("aria-pressed", "true");
      await expect.poll(async () => await helpfulVoteCount(member.id)).toBe(1);
      await browser.reload();
      await expect(helpful).toHaveAttribute("aria-pressed", "true");
      await helpful.tap();
      await expect(helpful).toHaveAttribute("aria-pressed", "false");
      await expect.poll(async () => await helpfulVoteCount(member.id)).toBe(0);
    } finally {
      await deleteAuthUsersByEmail(author.email);
    }
  },
);

materialTest(
  "未ログインの口コミ投稿は元の資材を保持してログインへ案内する",
  async ({ app, browser, material }) => {
    await app.open(`/materials/${material.id}/review/new`);
    await expect(browser).toHaveURL(
      new RegExp(`/login\\?next=${encodeURIComponent(`/materials/${material.id}/review/new`)}$`),
    );
  },
);
