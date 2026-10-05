import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Root, Element, RootContent, ElementContent } from "hast";
import * as v from "valibot";

/**
 * 記事本文の markdown を Server Component から呼び出して
 * sanitize 済 HTML 文字列に変換する。
 *
 * - rehype-sanitize の defaultSchema を維持する（<script>, <iframe>, on* 属性除去）。
 * - <img> の src は従来の *.supabase.co と placehold.co に加え、呼出し側が指定した
 *   Storage origin の公開 article-images URL のみ許可する。未指定時は従来ホストのみ。
 *   それ以外は src 属性を取り除く。
 * - 画像URL制限は defaultSchema の補助として、サニタイズ後に適用する。
 */

const ALLOWED_IMG_HOSTS = new Set<string>(["placehold.co"]);
const ALLOWED_IMG_HOST_SUFFIX = ".supabase.co";
const PUBLIC_ARTICLE_IMAGE_PATH = "/storage/v1/object/public/article-images/";

type MarkdownRenderOptions = {
  articleImageStorageOrigin?: string;
};

function isAllowedImageSrc(src: string, articleImageStorageOrigin: string | undefined): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return false;
  }
  const host = url.hostname;
  if (ALLOWED_IMG_HOSTS.has(host)) return true;
  if (host.endsWith(ALLOWED_IMG_HOST_SUFFIX)) return true;
  if (
    articleImageStorageOrigin === undefined ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    /%(?:2f|5c|2e|25)/i.test(url.pathname) ||
    !url.pathname.startsWith(PUBLIC_ARTICLE_IMAGE_PATH) ||
    url.pathname.length === PUBLIC_ARTICLE_IMAGE_PATH.length
  ) {
    return false;
  }
  return url.origin === articleImageStorageOrigin;
}

function stripDisallowedImgSrc(
  node: Root | Element,
  articleImageStorageOrigin: string | undefined,
): void {
  if (node.type === "element" && node.tagName === "img") {
    const src = node.properties?.src;
    const srcResult = v.safeParse(v.string(), src);
    if (srcResult.success && !isAllowedImageSrc(srcResult.output, articleImageStorageOrigin)) {
      delete node.properties.src;
    }
  }
  const children: ReadonlyArray<RootContent | ElementContent> = node.children;
  for (const child of children) {
    if (child.type === "element") {
      stripDisallowedImgSrc(child, articleImageStorageOrigin);
    }
  }
}

/**
 * sanitize 後の hast を walk して、許可外ホストの <img src> を剥がす。
 * defaultSchema の attributes / protocols 制限は通過済の前提。
 *
 * unified の Plugin として transformer 関数を直接返す（rehype-sanitize と同じスタイル）。
 */
function rehypeRestrictImageHosts(articleImageStorageOrigin: string | undefined) {
  return (tree: Root): Root => {
    stripDisallowedImgSrc(tree, articleImageStorageOrigin);
    return tree;
  };
}

export async function renderMarkdownToHtml(
  markdown: string,
  options: MarkdownRenderOptions = {},
): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize, defaultSchema)
    .use(rehypeRestrictImageHosts, options.articleImageStorageOrigin)
    .use(rehypeStringify);
  const file = await processor.process(markdown);
  return String(file);
}
