import { test } from "@e2e-dev/web";
import { credentials, expect } from "e2e";
import { deleteAuthUsersByEmail, uniqueToken } from "../../e2e/support/test-data";

test("一般会員を登録し同じニックネームでの再登録を拒否する", async ({ app, screen, browser }) => {
  const token = uniqueToken("army-signup");
  const email = `${token}@example.test`;
  const duplicateEmail = `${token}-duplicate@example.test`;
  const handle = `E2E_${token}`.slice(0, 30);
  try {
    for (const address of [email, duplicateEmail]) {
      await app.open("/signup/general");
      await screen.getByLabel("ニックネーム").fill(handle);
      await screen.getByLabel("本名（姓）").fill("試験");
      await screen.getByLabel("本名（名）").fill("太郎");
      await screen.getByLabel("郵便番号").fill("1000001");
      await screen.getByRole("combobox", /^都道府県/).selectOption({ value: "13" });
      await screen.getByLabel("市区町村").fill("千代田区");
      await screen.getByLabel("番地", { exact: false }).fill("千代田1-1");
      await screen.getByLabel("建物名・部屋番号").fill("試験ビル101号室");
      await screen.getByRole("checkbox", /利用規約/).check();
      await screen.getByLabel("メールアドレス").fill(address);
      await screen.getByLabel("パスワード").fill(credentials.user("general").password);
      await screen.getByRole("radio", "生産者").check();
      await screen.getByRole("button", "登録する").tap();
      if (address === email) {
        await expect(browser).toHaveURL("/signup/done");
        await expect(screen.getByRole("heading", "登録が完了しました")).toBeVisible();
        await app.clearState();
      } else {
        await expect(
          screen
            .getByRole("alert")
            .filter({ hasText: "このハンドルネームはすでに使われています。" }),
        ).toHaveCount(2);
        await expect(browser).toHaveURL("/signup/general");
        await expect(screen.getByLabel("番地", { exact: false })).toHaveValue("千代田1-1");
      }
    }
  } finally {
    await deleteAuthUsersByEmail(email);
    await deleteAuthUsersByEmail(duplicateEmail);
  }
});
