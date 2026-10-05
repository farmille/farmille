import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import { legalDocuments } from "../../src/content/legal/documents";
import { materialTest } from "../support/fixtures";

const legalBodySamples = new Map(
  Object.entries({
    terms: [
      "ファーミル株式会社が運営します。",
      "東京地方裁判所を第一審の専属的合意管轄裁判所とします。",
    ],
    posting: [
      "Farmille（ファーミル）内に実証詳細レポートや感想口コミを投稿",
      "改定された規約等については、サイト上あるいは電子メールで告知されるものとします。",
    ],
    profile: [
      "公開プロフィールガイドライン",
      "改定された規約等については、サイト上あるいは電子メールで告知されるものとします。",
    ],
    media: [
      "Farmille（ファーミル）にて画像および動画を投稿いただくにあたって",
      "改定された規約等については、サイト上あるいは電子メールで告知されるものとします。",
    ],
    "data-protection": [
      "個人情報の適切な取り扱いが強く求められている",
      "迅速かつ誠実に対応するための窓口を設置し",
    ],
    privacy: ["利用者のパーソナルデータを取得する場合があります。", "個人情報保護管理担当"],
    disclaimer: [
      "必ずお読みいただき、ご同意のうえでご利用ください。",
      "当社が書面により特別に許可している場合はこの限りではありません。",
    ],
    manufacturer: [
      "メーカー会員に適用される遵守事項を定めます。",
      "誠意をもって協議し、円満に解決を図るものとします。",
    ],
    advertising: [
      "以下のとおり表現のガイドラインを設けております。",
      "ルールを遵守した健全な情報提供にご協力をお願いいたします。",
    ],
    environment: ["以下の推奨環境でのご利用をお願いいたします。", "Android 13.0以降の端末"],
  } satisfies Record<string, readonly [string, string]>),
);

for (const path of ["/", "/search", "/articles", "/sellers", "/signup", "/legal"]) {
  test(`公開ページ${path}を375pxで閲覧する`, async ({ app, screen, browser }) => {
    await app.open(path);
    await expect(browser).toHaveURL(path);
    const main = screen.getByRole("main");
    await expect(main).toBeVisible();
    await expect(
      path === "/"
        ? main.getByRole("heading", "掲載資材一覧", { level: 1 })
        : main.getByRole("heading", { level: 1 }),
    ).toBeVisible();
    await expect(screen.getByText("ページを表示できませんでした")).toHaveCount(0);
    expect(
      await browser.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await app.screenshot(`public-${path.replaceAll("/", "-")}`);
    if (path === "/") {
      const signup = main.getByRole("region", "登録は無料");
      await expect(signup).toContainText("検索と感想口コミの閲覧は、登録なしで利用できます。");
      const registration = signup.getByRole("link", "無料で会員登録");
      await expect(registration).toHaveAttribute("href", "/signup/general");
      await registration.tap();
      await expect(browser).toHaveURL("/signup/general");
      await expect(screen.getByRole("heading", "一般ユーザー登録")).toBeVisible();
      await app.open("/");
      const manufacturer = screen
        .getByRole("region", "バイオスティミュラント・関連資材メーカー様へ")
        .getByRole("link", /メーカー様はこちら/);
      await expect(manufacturer).toHaveAttribute("href", "/sellers");
      await manufacturer.tap();
      await expect(browser).toHaveURL("/sellers");
      await expect(screen.getByRole("heading", "Farmille 企業様向け利用ガイド")).toBeVisible();
      await app.open("/");
      const query = "公開導線で検索した資材";
      const search = browser.locator('main form[aria-label="資材検索"]');
      await search.getByRole("searchbox").fill(query);
      await search.getByRole("button", "検索").tap();
      await expect(browser).toHaveURL(`/search?q=${encodeURIComponent(query)}`);
      await expect(screen.getByRole("heading", "BS資材を探す")).toBeVisible();
      await app.open("/");
      const post = screen.getByRole("navigation", "メインナビ").getByRole("link", "投稿する");
      await expect(post).toHaveAttribute("href", "/post");
      await post.tap();
      await expect(browser).toHaveURL("/login?next=%2Fpost");
      await expect(screen.getByLabel("メールアドレス", { exact: false })).toBeVisible();
    }
  });
}

for (const document of legalDocuments) {
  test(`規約${document.slug}の本文と一覧への戻り先を確認する`, async ({ app, screen, browser }) => {
    await app.open(`/legal/${document.slug}`);
    await expect(screen.getByRole("heading", document.title, { level: 1 })).toBeVisible();
    const samples = legalBodySamples.get(document.slug);
    if (samples === undefined) throw new Error(`規約${document.slug}の本文確認例がありません。`);
    await expect(browser.locator("#section-1 > div")).toContainText(samples[0]);
    await expect(browser.locator(`#section-${document.sections.length} > div`)).toContainText(
      samples[1],
    );
    const contents = screen.getByRole("navigation", "このページの目次");
    for (const [index, section] of document.sections.entries()) {
      const body = browser.locator(`#section-${index + 1} > div`);
      if (section.markdown.trim()) await expect(body).toContainText(/\S/);
      else await expect(body).toHaveText("");
      if (section.heading) {
        await expect(screen.getByRole("heading", section.heading, { level: 2 })).toHaveCount(1);
        await expect(contents.getByRole("link", section.heading)).toHaveAttribute(
          "href",
          `#section-${index + 1}`,
        );
      }
    }
    const lastSection = document.sections[document.sections.length - 1];
    await contents.getByRole("link", lastSection.heading).tap();
    await expect(browser).toHaveURL(`/legal/${document.slug}#section-${document.sections.length}`);
    await expect(screen.getByRole("heading", lastSection.heading, { level: 2 })).toBeVisible();
    await screen.getByRole("link", "規約・ガイドライン一覧へ").tap();
    await expect(browser).toHaveURL("/legal");
  });
}

for (const [path, title, description] of [
  [
    "/unknown-e2e-page",
    "ページが見つかりません",
    "指定されたページは存在しないか、移動した可能性があります。",
  ],
  [
    "/legal/unknown-e2e-document",
    "ページが見つかりません",
    "指定されたページは存在しないか、移動した可能性があります。",
  ],
  [
    "/materials/00000000-0000-4000-8000-000000000000",
    "資材が見つかりません",
    "指定された資材は存在しないか、公開が終了した可能性があります。",
  ],
  [
    "/reports/00000000-0000-4000-8000-000000000000",
    "ページが見つかりません",
    "指定されたページは存在しないか、移動した可能性があります。",
  ],
  [
    "/articles/00000000-0000-4000-8000-000000000000",
    "ページが見つかりません",
    "指定されたページは存在しないか、移動した可能性があります。",
  ],
  [
    "/users/00000000-0000-4000-8000-000000000000",
    "プロフィールが見つかりません",
    "指定されたユーザーは存在しないか、プロフィールを利用できません。",
  ],
  [
    "/sellers/00000000-0000-4000-8000-000000000000",
    "メーカーが見つかりません",
    "指定されたメーカーは存在しないか、現在公開されていません。",
  ],
]) {
  test(`存在しない${path}に日本語の404を表示する`, async ({ app, screen, browser }) => {
    await app.open(path);
    await expect(browser).toHaveURL(path);
    const main = screen.getByRole("main");
    await expect(main).toBeVisible();
    await expect(main.getByText(title)).toBeVisible();
    await expect(main.getByText(description)).toBeVisible();
    await expect(screen.getByText("ページを表示できませんでした")).toHaveCount(0);
    const home = main.getByRole("link", "ホームへ戻る");
    await expect(home).toHaveAttribute("href", "/");
    await home.tap();
    await expect(browser).toHaveURL("/");
    await expect(screen.getByRole("main").getByRole("heading", "掲載資材一覧")).toBeVisible();
  });
}

materialTest(
  "資材詳細から口コミと関連記事を閲覧する",
  async ({ app, screen, browser, material }) => {
    for (const suffix of ["", "/reviews", "/articles"]) {
      await app.open(`/materials/${material.id}${suffix}`);
      await expect(browser).toHaveURL(`/materials/${material.id}${suffix}`);
      await expect(screen.getByRole("main")).toContainText(material.name);
      await expect(screen.getByText("ページを表示できませんでした")).toHaveCount(0);
    }
  },
);
