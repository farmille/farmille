import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import type { Root, Element, RootContent, ElementContent } from "hast";
import * as v from "valibot";

/**
 * 記事本文の Markdown を sanitize 済みの HTML 文字列に変換する。
 *
 * spec §6.2 / §10.1:
 * - rehype-sanitize の defaultSchema をベースにする（<script>, <iframe>, on* 属性除去）
 * - <img> の src は *.supabase.co と placehold.co のホストのみ許可。
 *   それ以外のホスト（http(s)）の <img> は src 属性を取り除き、画像が表示されないようにする。
 *
 * 実装メモ:
 * - サニタイズ allowlist を独自に「緩める」拡張は spec §10.1 の方針に反するため行わない。
 *   ホスト制限は defaultSchema の補助として、サニタイズ後にもう一段プラグインで実施する。
 * - spec §6.2 は "remark-html + rehype-sanitize" と表記しているが、remark-html は
 *   mdast→HTML を直接出力し hast 段階を経由しないため、hast ベースの rehype-sanitize と
 *   組み合わせられない。同等の挙動を保つため remark-parse + remark-rehype +
 *   rehype-sanitize + rehype-stringify の標準パイプを採用している。
 */

const ALLOWED_IMG_HOSTS = new Set<string>(["placehold.co"]);
const ALLOWED_IMG_HOST_SUFFIX = ".supabase.co";

function isAllowedImageSrc(src: string): boolean {
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

  return false;
}

function stripDisallowedImgSrc(node: Root | Element): void {
  if (node.type === "element" && node.tagName === "img") {
    const src = node.properties?.src;
    const srcResult = v.safeParse(v.string(), src);

    if (srcResult.success && !isAllowedImageSrc(srcResult.output)) {
      delete node.properties.src;
    }
  }

  const children: ReadonlyArray<RootContent | ElementContent> = node.children;

  for (const child of children) {
    if (child.type === "element") {
      stripDisallowedImgSrc(child);
    }
  }
}

/**
 * sanitize 後の hast を walk して、許可外ホストの <img src> を剥がす。
 * defaultSchema の attributes / protocols 制限は通過済の前提。
 *
 * unified の Plugin として transformer 関数を直接返す（rehype-sanitize と同じスタイル）。
 */
function rehypeRestrictImageHosts() {
  return (tree: Root): Root => {
    stripDisallowedImgSrc(tree);

    return tree;
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSanitize, defaultSchema)
  .use(rehypeRestrictImageHosts)
  .use(rehypeStringify);

export function renderMarkdownToHtml(markdown: string): string {
  const file = processor.processSync(markdown);

  return String(file);
}
