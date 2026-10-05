import { expect } from "e2e";
import { memberTest, materialTest } from "../support/fixtures";
import { loginMember } from "../support/ui";
import { refreshCatalogThroughAdmin } from "../support/catalog-fixture";

materialTest("Luna6が資材検索から詳細へ進む", async ({ app, agent, screen, browser, material }) => {
  await refreshCatalogThroughAdmin(app, screen, browser, material.id);
  await app.open("/search");
  await agent.act("資材名{name}を検索して、その資材の詳細ページを開いてください。", {
    params: { name: material.name },
  });
  await expect(browser).toHaveURL(`/materials/${material.id}`);
  await expect(screen.getByRole("main")).toContainText(material.name);
});

memberTest(
  "Luna6が一般会員の自己紹介を変更する",
  async ({ app, screen, browser, agent, member }) => {
    const bio = `トマト栽培の観察を記録しています。${member.id}`;
    await loginMember(app, screen, browser, member);
    await agent.act("表示情報を編集する画面を開いて、自己紹介を{bio}に変更し保存してください。", {
      params: { bio },
    });
    await expect(browser).toHaveURL("/me");
    await app.open("/me/edit");
    await expect(screen.getByLabel("自己紹介", { exact: false })).toHaveValue(bio);
  },
);
