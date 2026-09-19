import type { MaterialPageContent } from "@/lib/material-page-editor";

type MaterialLink = MaterialPageContent["links"][number];
const priority = { overview: 0, safety: 1, technical: 2 };

/** 資料名と表示順は最初の記載を保ち、同一URLの分類だけを優先順位で決める。 */
export function uniqueMaterialLinks(links: MaterialLink[]): MaterialLink[] {
  const unique = new Map<string, MaterialLink>();
  const result: MaterialLink[] = [];
  for (const link of links) {
    const url = link.url.trim();
    // 編集中の未入力行はそれぞれ残す。
    if (!url) {
      result.push(link);
      continue;
    }
    const previous = unique.get(url);
    if (previous) {
      if (priority[link.group] > priority[previous.group]) previous.group = link.group;
      continue;
    }
    const item = { ...link, url };
    unique.set(url, item);
    result.push(item);
  }
  return result;
}
