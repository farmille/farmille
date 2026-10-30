"use client";

import { useForm, useStore } from "@tanstack/react-form";
import { createSerializer, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { css } from "../../styled-system/css";
import { FilterPills } from "./FilterPills";
import { SearchInput } from "@/components/form";

const FILTER_OPTIONS = [
  { value: "all", label: "すべて" },
  { value: "report", label: "実証詳細レポート" },
  { value: "article", label: "記事" },
] as const;

const queryParsers = {
  type: parseAsStringLiteral(FILTER_OPTIONS.map((option) => option.value)).withDefault("all"),
  q: parseAsString.withDefault(""),
  page: parseAsString,
};

const serializeQuery = createSerializer(queryParsers);

/** 記事一覧の検索ボックス＋フィルタピル。URL の q / type / page を更新する。 */
export function ArticlesToolbar() {
  const [{ type, q }, setQuery] = useQueryStates(queryParsers, {
    shallow: false,
    history: "push",
    scroll: true,
  });

  return (
    <div>
      <ArticleSearch
        key={`${type}:${q}`}
        filter={type}
        query={q}
        onSubmit={(q) => {
          void setQuery({ q, page: null });
        }}
      />

      <FilterPills
        aria-label="コンテンツ種別"
        items={FILTER_OPTIONS.map((option) => ({
          href: serializeQuery("/articles", { type: option.value, q: q.trim(), page: null }),
          label: option.label,
          current: option.value === type,
        }))}
      />
    </div>
  );
}

function ArticleSearch({
  query,
  filter,
  onSubmit,
}: {
  query: string;
  filter: (typeof FILTER_OPTIONS)[number]["value"];
  onSubmit: (query: string) => void;
}) {
  const form = useForm({
    defaultValues: { query },
    onSubmit: ({ value }) => onSubmit(value.query.trim()),
  });

  const input = useStore(form.store, (state) => state.values.query);

  return (
    <form
      action="/articles"
      className={css({ mb: "3" })}
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      {filter !== "all" ? <input type="hidden" name="type" value={filter} /> : null}
      <SearchInput
        aria-label="記事を検索"
        name="q"
        onValueChange={(next) => form.setFieldValue("query", next)}
        placeholder="記事を検索"
        value={input}
      />
    </form>
  );
}
