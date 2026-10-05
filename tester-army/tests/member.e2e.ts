import { credentials, expect } from "e2e";
import { memberTest, materialTest } from "../support/fixtures";
import { loginMember } from "../support/ui";

memberTest("ログインの戻り先とログアウトを確認する", async ({ app, screen, browser, member }) => {
  await app.open("/me");
  await expect(browser).toHaveURL(/\/login\?next=%2Fme$/);
  await loginMember(app, screen, browser, member);
  await expect(screen.getByText(member.handle)).toBeVisible();
  await screen.getByRole("button", "ログアウト").tap();
  await expect(browser).toHaveURL("/");
  await app.open("/me");
  await expect(browser).toHaveURL(/\/login\?next=%2Fme$/);
});

memberTest("外部の戻り先へログイン後に遷移しない", async ({ app, screen, browser, member }) => {
  await app.open("/login?next=https%3A%2F%2Fevil.example%2Fsteal");
  await screen.getByLabel("メールアドレス").fill(member.email);
  await screen.getByLabel("パスワード").fill(credentials.user("general").password);
  await screen.getByRole("button", "ログインする").tap();
  await expect(browser).toHaveURL("/");
});

memberTest("一般会員が企業と運営の権限を取得しない", async ({ app, screen, browser, member }) => {
  await loginMember(app, screen, browser, member);
  await app.open("/dashboard");
  await expect(
    screen.getByRole("heading", "企業会員のログインIDでログインしてください"),
  ).toBeVisible();
  await app.open("/admin");
  await expect(screen.getByRole("heading", "ページが見つかりません")).toBeVisible();
});

memberTest(
  "プロフィールの変更を保存し再読込と公開ページで確認する",
  async ({ app, screen, browser, member }) => {
    const handle = `E2E更新_${member.id.slice(0, 8)}`;
    const bio = "トマトを育てながら資材の使い方を記録しています。";
    const affiliation = "E2E検証農園";
    await loginMember(app, screen, browser, member, "/me/edit");
    await screen.getByLabel("ハンドルネーム").fill(handle);
    await screen.getByLabel("自己紹介").fill(bio);
    await screen.getByLabel("所属").fill(affiliation);
    await screen.getByRole("button", "所属を追加").tap();
    await screen.getByLabel("リンク").fill("https://example.test/farm");
    await screen.getByRole("button", "保存する").tap();
    await expect(browser).toHaveURL("/me");
    await app.open("/me/edit");
    await expect(screen.getByLabel("ハンドルネーム")).toHaveValue(handle);
    await expect(screen.getByLabel("自己紹介")).toHaveValue(bio);
    await expect(screen.getByRole("button", `${affiliation} ×`)).toBeVisible();
    await app.clearState();
    await app.open(`/users/${member.id}`);
    await expect(screen.getByRole("heading", handle)).toBeVisible();
    await expect(screen.getByText(bio)).toBeVisible();
    await expect(screen.getByText(affiliation)).toBeVisible();
    await expect(screen.getByRole("link", /example.test/)).toHaveAttribute(
      "href",
      "https://example.test/farm",
    );
    await app.screenshot("public-profile-saved");
  },
);

materialTest(
  "投稿選択から資材を選び口コミ作成へ進む",
  async ({ app, screen, browser, member, material }) => {
    await loginMember(app, screen, browser, member, "/post");
    await screen.getByLabel("資材名・メーカー名で検索").fill(material.name);
    await screen.getByRole("button", "検索").tap();
    await screen.getByRole("button", new RegExp(material.name)).tap();
    await screen.getByRole("link", /感想口コミ/).tap();
    await expect(browser).toHaveURL(`/materials/${material.id}/review/new`);
    await expect(screen.getByLabel("感想口コミ本文")).toBeVisible();
  },
);
