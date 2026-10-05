import { afterEach, describe, expect, it, vi } from "vitest";
import { renderMarkdownToHtml } from "./render";

const storageOrigin = "http://127.0.0.1:58321";
const articleImagePath =
  "/storage/v1/object/public/article-images/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.png";
const articleImageOptions = { articleImageStorageOrigin: storageOrigin };

describe("記事本文の画像URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("設定済みのローカルStorageへアップロードした公開記事画像を表示する", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    const src = `${storageOrigin}${articleImagePath}`;

    expect(await renderMarkdownToHtml(`![画像](${src})`, articleImageOptions)).toBe(
      `<p><img src="${src}" alt="画像"></p>`,
    );
  });

  it("設定済みの独自ドメインStorageでも公開記事画像を表示する", async () => {
    const configuredOrigin = "https://storage.farmille.example";
    const src = `${configuredOrigin}${articleImagePath}`;

    expect(
      await renderMarkdownToHtml(`![画像](${src})`, {
        articleImageStorageOrigin: configuredOrigin,
      }),
    ).toBe(`<p><img src="${src}" alt="画像"></p>`);
  });

  it.each([
    `http://127.0.0.1:58322${articleImagePath}`,
    `http://localhost:58321${articleImagePath}`,
    `http://127.0.0.2:58321${articleImagePath}`,
    `https://127.0.0.1:58321${articleImagePath}`,
    `http://uploader:password@127.0.0.1:58321${articleImagePath}`,
    `http://uploader@127.0.0.1:58321${articleImagePath}`,
    `${storageOrigin}/storage/v1/object/private/article-images/image.png`,
    `${storageOrigin}/storage/v1/object/sign/article-images/image.png?token=signed`,
    `${storageOrigin}/storage/v1/object/authenticated/article-images/image.png`,
    `${storageOrigin}/storage/v1/object/public/report-media/image.png`,
    `${storageOrigin}/storage/v1/object/public/article-images-other/image.png`,
    `${storageOrigin}/storage/v1/object/public/article-images/`,
    `${storageOrigin}/storage/v1/object/public/article-images/../report-media/image.png`,
    `${storageOrigin}/storage/v1/object/public/article-images/%2e%2e%2fprivate%2Fsecret.png`,
    `${storageOrigin}/storage/v1/object/public/article-images/%2E%2E%2Fprivate%2fsecret.png`,
    `${storageOrigin}/storage/v1/object/public/article-images/a%2F..%2F..%2Fprivate%2Fsecret.png`,
    `${storageOrigin}/storage/v1/object/public/article-images/%2e%2e%5cprivate%5Csecret.png`,
    `${storageOrigin}/storage/v1/object/public/article-images/a%5C..%5C..%5Cprivate%5Csecret.png`,
    `${storageOrigin}/storage/v1/object/public/article-images/%252e%252e%252fprivate.png`,
    `${storageOrigin}/storage/v1/object/public/article-images/%25252e%25252e%25252fprivate.png`,
    `${storageOrigin}/rest/v1/article-images/image.png`,
    `${storageOrigin}${articleImagePath}?token=signed`,
    `https://storage.example${articleImagePath}`,
    `https://project.supabase.co.attacker.example${articleImagePath}`,
  ])("設定済みの公開記事画像に限定し、許可外URLのsrcを除去する: %s", async (src) => {
    expect(await renderMarkdownToHtml(`![画像](${src})`, articleImageOptions)).toBe(
      '<p><img alt="画像"></p>',
    );
  });

  it.each([
    "https://placehold.co/600x400",
    "https://existing-project.supabase.co/storage/v1/object/public/article-images/image.png",
  ])("従来許可された公開済み画像を引き続き表示する: %s", async (src) => {
    expect(await renderMarkdownToHtml(`![画像](${src})`)).toBe(
      `<p><img src="${src}" alt="画像"></p>`,
    );
  });

  it("画像表示を追加しても危険なURLとHTMLを本文へ出力しない", async () => {
    const src = `${storageOrigin}${articleImagePath}`;
    const html = await renderMarkdownToHtml(
      `![画像](${src})\n\n[リンク](javascript:alert%281%29)\n\n![危険な画像](javascript:alert%281%29)\n\n<script>alert(1)</script>\n\n<iframe src="https://attacker.example"></iframe>\n\n<img src="${src}" onerror="alert(1)">`,
      articleImageOptions,
    );

    expect(html).toBe(
      `<p><img src="${src}" alt="画像"></p>\n<p><a>リンク</a></p>\n<p><img alt="危険な画像"></p>`,
    );
  });

  it("画像のない本文はStorage設定を参照せず従来どおり表示する", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);

    expect(await renderMarkdownToHtml("**本文**")).toBe("<p><strong>本文</strong></p>");
  });

  it.each([
    `${storageOrigin}${articleImagePath}`,
    `https://unconfigured.example${articleImagePath}`,
    "https://unconfigured.example/image.png",
  ])("環境変数もオプションもない場合は許可外画像を除去して本文を保持する: %s", async (src) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);

    expect(await renderMarkdownToHtml(`![画像](${src})\n\n**本文**`)).toBe(
      '<p><img alt="画像"></p>\n<p><strong>本文</strong></p>',
    );
  });

  it("設定の異なる同時描画でも画像の許可範囲を共有しない", async () => {
    const src = `${storageOrigin}${articleImagePath}`;
    const markdown = `![画像](${src})`;

    const html = await Promise.all([
      renderMarkdownToHtml(markdown, articleImageOptions),
      renderMarkdownToHtml(markdown, {
        articleImageStorageOrigin: "https://storage.farmille.example",
      }),
      renderMarkdownToHtml(markdown),
      renderMarkdownToHtml(markdown, articleImageOptions),
    ]);

    expect(html).toEqual([
      `<p><img src="${src}" alt="画像"></p>`,
      '<p><img alt="画像"></p>',
      '<p><img alt="画像"></p>',
      `<p><img src="${src}" alt="画像"></p>`,
    ]);
  });
});
