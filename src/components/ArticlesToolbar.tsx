"use client";

import { useRouter } from "next/navigation";

import { css } from "../../styled-system/css";
import { formDataString } from "@/lib/validation";
import { FilterPills } from "./FilterPills";
import { SearchInput } from "@/components/form";

const FILTER_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "report", label: "実証詳細レポート" },
  { value: "article", label: "記事" },
] as const;

type ArticlesToolbarProps = {
  filter: string;
  q: string;
};

/** 記事一覧の検索ボックス＋フィルタピル。URL の q / type / page を更新する。 */
export function ArticlesToolbar({ filter, q }: ArticlesToolbarProps) {
  const router = useRouter();

  function buildHref(next: { filter?: string; q?: string }): string {
    const params = new URLSearchParams();
    const nextFilter = next.filter ?? filter;
    const nextQ = next.q ?? q;

    if (nextFilter !== "all") {
      params.set("type", nextFilter);
    }
    if (nextQ.trim().length > 0) {
      params.set("q", nextQ.trim());
    }

    const query = params.toString();
    return query.length > 0 ? `/articles?${query}` : "/articles";
  }

  return (
    <div>
      <form
        className={css({ mb: "3" })}
        action="/articles"
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextQ = formDataString(formData.get("q")) ?? "";
          router.push(buildHref({ q: nextQ }));
        }}
      >
        {filter !== "all" ? <input type="hidden" name="type" value={filter} /> : null}
        <SearchInput name="q" defaultValue={q} placeholder="記事を検索" aria-label="記事を検索" />
      </form>

      <FilterPills
        aria-label="コンテンツ種別"
        items={FILTER_OPTIONS.map((option) => ({
          href: buildHref({ filter: option.value }),
          label: option.label,
          current: option.value === filter,
        }))}
      />
    </div>
  );
}
