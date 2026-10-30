import type { MaterialDetail } from "@/server/queries/materials";
import type { MaterialPageContent } from "@/lib/material-page-editor";

type MaterialLink = MaterialPageContent["links"][number];

const priority = new Map([
  ["overview", 0],
  ["safety", 1],
  ["technical", 2],
]);

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
      if ((priority.get(link.group ?? "") ?? -1) > (priority.get(previous.group ?? "") ?? -1))
        previous.group = link.group;
      continue;
    }

    const item = { ...link, url };
    unique.set(url, item);
    result.push(item);
  }

  return result;
}

export function materialSourceLinks(
  material: Pick<MaterialDetail, "official_url" | "catalog_url"> & {
    evidences: Pick<
      MaterialDetail["evidences"][number],
      "evidence_type" | "title" | "file_url" | "external_url"
    >[];
  },
): MaterialLink[] {
  const links: MaterialLink[] = [];

  if (material.official_url)
    links.push({
      group: "overview",
      title: "公式製品ページ",
      url: material.official_url,
      trial: null,
    });

  if (material.catalog_url)
    links.push({
      group: "overview",
      title: "公式カタログ",
      url: material.catalog_url,
      trial: null,
    });

  for (const evidence of material.evidences) {
    const url = evidence.file_url || evidence.external_url;

    if (url)
      links.push({
        group:
          evidence.evidence_type === "sds"
            ? "safety"
            : evidence.evidence_type === "leaflet"
              ? "overview"
              : "technical",
        title: evidence.title,
        url,
        trial: null,
      });
  }

  return uniqueMaterialLinks(links);
}
