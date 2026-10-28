import { expect, test } from "@playwright/test";
import { E2E_ADMIN_ACCOUNTS } from "./support/admin-accounts";
import {
  cleanupSellerByLoginId,
  createApprovedSeller,
  createGeneralUser,
  createMaterial,
  createReview,
  deleteAuthUsersByEmail,
  deleteMaterial,
  getMaterial,
  seedCatalogMaterial,
  uniqueToken,
} from "./support/test-data";
import { chooseOption, loginAdminAndEnrollMfa, loginSeller } from "./support/ui";

test("書類確認で資材単位の資材オーナー権限を付与し、原稿を表現確認後に公開する", async ({
  browser,
  page,
}) => {
  const seller = await createApprovedSeller("editor");
  const reviewer = await createGeneralUser("archive-reviewer");
  const material = await createMaterial("editor", null, seller.officialName);
  const otherMaterial = await createMaterial("no-right", null, seller.officialName);
  const description = `製品説明_${uniqueToken("description")}`;
  const documents = [
    { group: "overview", label: "概要（製品説明・パンフレット・画像）", title: "製品パンフレット" },
    {
      group: "public_trial",
      label: "公的試験結果（都道府県の試験場など公的機関で実施した試験結果）",
      title: "公的試験報告",
    },
  ];
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const adminPage = await adminContext.newPage();
  try {
    await seedCatalogMaterial(material.id);
    await page.goto(`/materials/${material.id}`);
    await expect(
      page.getByRole("link", { name: "取り込み資料（削除対象）", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "取り込み試験資料", exact: true })).toBeVisible();
    await expect(page.getByText("Catalog Material Official", { exact: true })).toBeVisible();
    await expect(page.getByRole("img", { name: `${material.name}の容器イメージ` })).toBeVisible();
    await loginSeller(page, seller);
    await page.goto(`/dashboard/materials/${material.id}`);
    await expect(
      page.getByText("資材オーナー権限の書類確認が必要です", { exact: true }),
    ).toBeVisible();
    await loginAdminAndEnrollMfa(
      adminPage,
      E2E_ADMIN_ACCOUNTS.materialGovernance,
      `/admin/materials/${material.id}`,
    );
    await chooseOption(
      adminPage,
      adminPage.getByLabel("資材オーナー権限を付与するメーカー"),
      `${seller.officialName}（${seller.loginId}）`,
    );
    await adminPage
      .getByLabel("確認資料の保管先または受付番号")
      .fill(`E2E-DOCUMENT-${material.id}`);
    await adminPage.getByRole("button", { name: "資材オーナー権限を更新する" }).click();
    await expect(
      adminPage.getByText("書類確認の記録を保存し、この資材の資材オーナー権限を付与しました。"),
    ).toBeVisible();
    expect((await getMaterial(material.id)).seller_id).toBe(seller.id);
    expect((await getMaterial(otherMaterial.id)).seller_id).toBeNull();
    await page.goto(`/dashboard/materials/${otherMaterial.id}`);
    await expect(
      page.getByText("資材オーナー権限の書類確認が必要です", { exact: true }),
    ).toBeVisible();
    await page.goto(`/dashboard/materials/${material.id}`);
    await expect(page.getByRole("img", { name: "容器のイメージ", exact: true })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
    const importedOverview = page
      .getByRole("heading", { name: documents[0].label, exact: true })
      .locator("..");
    await importedOverview.getByRole("button", { name: "資料を外す", exact: true }).click();
    await page.getByRole("textbox", { name: "製品説明", exact: true }).fill(description);
    await page.getByLabel("主な成分", { exact: true }).fill("海藻抽出物");
    await page.getByRole("checkbox", { name: "播種・定植時", exact: true }).check();
    for (const document of documents) {
      const group = page.getByRole("heading", { name: document.label, exact: true }).locator("..");
      if (document.group !== "public_trial")
        await group.getByRole("button", { name: "資料を追加", exact: true }).click();
      await group.getByRole("textbox", { name: "資料名", exact: true }).fill(document.title);
      await group
        .getByRole("textbox", { name: "資料URL", exact: true })
        .fill(`https://example.com/${document.group}.pdf`);
      if (document.group === "public_trial") {
        await group
          .getByRole("textbox", { name: "試験の作目（任意）", exact: true })
          .fill("トマト");
        await group
          .getByRole("textbox", { name: "試験の概要（任意）", exact: true })
          .fill(`${document.title}の概要`);
        await group
          .getByRole("textbox", { name: "試験の実施機関（任意）", exact: true })
          .fill(`${document.title}の実施機関`);
        await group
          .getByRole("spinbutton", { name: "試験実施年（任意）", exact: true })
          .fill("2025");
        await group
          .getByRole("spinbutton", { name: "資料のページ数（任意）", exact: true })
          .fill("12");
      }
    }
    await page.getByRole("checkbox", { name: "農薬登録", exact: true }).check();
    await page.getByRole("textbox", { name: "農薬登録者", exact: true }).fill("農薬登録会社");
    await page
      .getByRole("textbox", { name: "農薬としての効果・特徴", exact: true })
      .fill("製品表示に沿った効果");
    await page.getByRole("checkbox", { name: "土壌改良資材", exact: true }).check();
    await page
      .getByRole("textbox", { name: "表示者（土壌改良資材）", exact: true })
      .fill("土壌改良資材の表示会社");
    await page.getByRole("textbox", { name: "関係会社1", exact: true }).fill("製造会社");
    await page.getByRole("button", { name: "関係会社を追加", exact: true }).click();
    await page.getByRole("textbox", { name: "関係会社2", exact: true }).fill("販売会社");
    await page.getByRole("button", { name: "下書きを保存", exact: true }).click();
    await expect(page.getByText("下書きを保存しました。", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("textbox", { name: "製品説明", exact: true })).toHaveValue(
      description,
    );
    for (const document of documents) {
      const group = page.getByRole("heading", { name: document.label, exact: true }).locator("..");
      await expect(group.getByRole("combobox", { name: "資料の分類", exact: true })).toContainText(
        document.label,
      );
      await expect(group.getByRole("textbox", { name: "資料名", exact: true })).toHaveValue(
        document.title,
      );
      if (document.group === "public_trial") {
        await expect(
          group.getByRole("textbox", { name: "試験の概要（任意）", exact: true }),
        ).toHaveValue(`${document.title}の概要`);
        await expect(
          group.getByRole("spinbutton", { name: "試験実施年（任意）", exact: true }),
        ).toHaveValue("2025");
        await expect(
          group.getByRole("spinbutton", { name: "資料のページ数（任意）", exact: true }),
        ).toHaveValue("12");
      }
    }
    await expect(page.getByRole("textbox", { name: "農薬登録者", exact: true })).toHaveValue(
      "農薬登録会社",
    );
    await expect(page.getByRole("textbox", { name: "関係会社2", exact: true })).toHaveValue(
      "販売会社",
    );
    await page.getByRole("button", { name: "プレビュー", exact: true }).click();
    await expect(page.getByText(description, { exact: true })).toBeVisible();
    await expect(page.getByText("製造会社、販売会社", { exact: true })).toBeVisible();
    await expect(page.getByText("公的試験報告の概要", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "編集に戻る", exact: true }).click();
    await page.getByRole("button", { name: "保存して表現確認へ送る", exact: true }).click();
    await expect(
      page.getByText("表現確認中です。公開内容は確認完了後に変わります。"),
    ).toBeVisible();
    await page.goto(`/materials/${material.id}`);
    await expect(page.getByText(description, { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "取り込み資料（削除対象）", exact: true }),
    ).toBeVisible();
    await adminPage.goto("/admin/materials/expressions");
    const card = adminPage
      .locator("section, article, div")
      .filter({ has: adminPage.getByRole("heading", { name: material.name, exact: true }) })
      .filter({ has: adminPage.getByRole("link", { name: "原稿を確認", exact: true }) })
      .last();
    await card.getByRole("link", { name: "原稿を確認", exact: true }).click();
    await expect(adminPage.getByText(description, { exact: true }).first()).toBeVisible();
    await expect(adminPage.getByText("公的試験報告の概要", { exact: true })).toBeVisible();
    await expect(adminPage.getByText("農薬登録会社", { exact: true })).toBeVisible();
    await expect(adminPage.getByText("製造会社、販売会社", { exact: true })).toBeVisible();
    await adminPage.getByRole("button", { name: "表現確認を完了して反映", exact: true }).click();
    await expect(
      adminPage.getByText("この原稿の表現確認は終了しています。", { exact: true }),
    ).toBeVisible();
    await page.goto(`/materials/${material.id}`);
    await expect(page.getByText(description, { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "取り込み資料（削除対象）", exact: true }),
    ).toHaveCount(0);
    for (const document of documents) {
      await expect(page.getByRole("heading", { name: document.label, exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: document.title, exact: true })).toHaveAttribute(
        "href",
        `https://example.com/${document.group}.pdf`,
      );
    }
    await expect(page.getByText("公的試験報告の概要", { exact: true })).toBeVisible();
    await expect(page.getByText("農薬登録会社", { exact: true })).toBeVisible();
    await expect(page.getByText("製品表示に沿った効果", { exact: true })).toBeVisible();
    await expect(page.getByText("土壌改良資材の表示会社", { exact: true })).toBeVisible();
    await expect(page.getByText("製造会社、販売会社", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: seller.officialName, exact: true }),
    ).toHaveAttribute("href", `/sellers/${seller.id}`);
    await page.getByRole("link", { name: seller.officialName, exact: true }).click();
    await page.goto(`/dashboard/materials/${material.id}`);
    await page.getByRole("link", { name: /公開済み/ }).click();
    await expect(page.getByRole("img", { name: "容器のイメージ", exact: true })).toBeVisible();
    expect((await getMaterial(material.id)).seller_id).toBe(seller.id);
    await createReview({
      materialId: material.id,
      authorUserId: reviewer.id,
      rating: 4,
      body: "非公開後も保持する感想口コミ",
    });
    await page.goto(`/dashboard/materials/${material.id}`);
    await expect(page.getByRole("link", { name: /公開済み/ })).toBeVisible();
    await page.getByLabel("非公開にする理由").fill("販売終了のため");
    await page.getByRole("button", { name: "理由を記録して非公開にする" }).click();
    await expect(page.getByText("非公開", { exact: true })).toBeVisible();
    const anonymous = await browser.newPage();
    try {
      await anonymous.goto(`/materials/${material.id}`);
      await expect(
        anonymous.getByRole("main").getByText("資材が見つかりません", { exact: true }),
      ).toBeVisible();
      await anonymous.goto("/");
      await expect(
        anonymous.getByText("非公開後も保持する感想口コミ", { exact: true }),
      ).toHaveCount(0);
    } finally {
      await anonymous.close();
    }
  } finally {
    await adminContext.close();
    await deleteMaterial(otherMaterial.id);
    await deleteMaterial(material.id);
    await cleanupSellerByLoginId(seller.loginId);
    await deleteAuthUsersByEmail(reviewer.email);
  }
});
