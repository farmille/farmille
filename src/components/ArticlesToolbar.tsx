"use client";

import { useRouter } from "next/navigation";

import { css } from "../../styled-system/css";
import { formDataString } from "@/lib/validation";
import { FilterPills } from "./FilterPills";
import { Icon } from "@/components/Icon";

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
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "2",
          bg: "surface.card",
          borderWidth: "1.5px",
          borderStyle: "solid",
          borderColor: "border.strong",
          borderRadius: "card",
          px: "3",
          py: "2.5",
          mb: "3",
          _focusWithin: {
            borderColor: "primary.600",
            outlineWidth: "2px",
            outlineStyle: "solid",
            outlineColor: "primary.200",
          },
        })}
        action="/articles"
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const nextQ = formDataString(formData.get("q")) ?? "";
          router.push(buildHref({ q: nextQ }));
        }}
      >
        <Icon name="search" size="sm" className={css({ color: "text.subtle", flexShrink: "0" })} />
        {filter !== "all" ? <input type="hidden" name="type" value={filter} /> : null}
        <input
          className={css({
            flex: "1",
            borderWidth: "0",
            bg: "transparent",
            fontSize: "md",
            fontFamily: "sans",
            color: "text.default",
            outline: "none",
            _placeholder: { color: "text.subtle" },
          })}
          name="q"
          defaultValue={q}
          placeholder="記事を検索"
          aria-label="記事を検索"
        />
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
