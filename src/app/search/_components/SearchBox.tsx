"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { Chip } from "@/components/Chip";
import { Autocomplete, type Option } from "@/components/form";
import { TAG_CATEGORY_LABELS } from "@/components/TagChip";
import {
  buildSearchHref,
  searchFilterItemToSelected,
  selectedFilterCategory,
  selectedFilterKey,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";
import { matchSearchCatalog, type SearchCatalog } from "@/lib/material-search";
import { css, cva } from "../../../../styled-system/css";

type SearchBoxProps = {
  initialQuery: string;
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  catalog: SearchCatalog;
};

const SUGGESTION_LIMIT = 8;

const tint = (hue: string) => ({
  bg: `color-mix(in srgb, ${hue} 15%, token(colors.surface.card))`,
  color: `color-mix(in srgb, ${hue} 68%, token(colors.text.default))`,
});

const categoryLabelRecipe = cva({
  base: {
    py: "0.5",
    px: "1.5",
    borderRadius: "mark",
    fontSize: "xs",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  variants: {
    category: {
      crop: tint("token(colors.primary.700)"),
      concern: tint("token(colors.tag.concern)"),
      effect: tint("token(colors.tag.effect)"),
      cond: tint("token(colors.tag.cond)"),
      genre: tint("token(colors.tag.type)"),
      maker: tint("token(colors.text.subtle)"),
      name: tint("token(colors.tag.name)"),
    },
  },
});

export function SearchBox({ initialQuery, selected, sort, catalog }: SearchBoxProps) {
  const router = useRouter();
  const [input, setInput] = useState<{ value: string; urlQuery: string; requested: string | null }>(
    { value: initialQuery, urlQuery: initialQuery, requested: null },
  );
  const [composing, setComposing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const query = input.value;

  if (input.urlQuery !== initialQuery) {
    setInput({
      value: input.requested === initialQuery ? input.value : initialQuery,
      urlQuery: initialQuery,
      requested: null,
    });
  }

  useEffect(() => {
    if (composing || isPending || query.trim() === initialQuery) return;
    const timer = setTimeout(() => {
      setInput((current) => ({ ...current, requested: query.trim() }));
      startTransition(() => {
        router.replace(buildSearchHref({ filters: selected, sort, query }), { scroll: false });
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [composing, initialQuery, isPending, query, router, selected, sort]);

  const selectedKeys = useMemo(() => new Set(selected.map(selectedFilterKey)), [selected]);

  const navigate = (nextFilters: SelectedSearchFilter[], nextQuery = query) => {
    setInput((current) => ({ ...current, value: nextQuery, requested: nextQuery.trim() }));
    const href = buildSearchHref({ filters: nextFilters, sort, query: nextQuery });
    startTransition(() => router.push(href, { scroll: false }));
  };

  const keyword = query.trim();
  const suggestions = useMemo((): SelectedSearchFilter[] => {
    if (keyword.length === 0) return [];
    const matches = matchSearchCatalog(catalog, keyword);
    const candidates: SelectedSearchFilter[] = [
      ...matches.filters.map(searchFilterItemToSelected),
      ...matches.materialNames.map((name): SelectedSearchFilter => ({ kind: "name", name })),
      ...matches.makerNames.map((name): SelectedSearchFilter => ({ kind: "maker", name })),
    ];
    return candidates
      .filter((filter) => !selectedKeys.has(selectedFilterKey(filter)))
      .slice(0, SUGGESTION_LIMIT);
  }, [catalog, keyword, selectedKeys]);

  const suggestionOf = (option: Option) =>
    suggestions.find((filter) => selectedFilterKey(filter) === option.value);

  return (
    // 変換中の入力で検索しないよう、入力欄から伝わる変換の開始・終了を受け取る
    <div
      aria-busy={isPending || undefined}
      onCompositionEnd={() => setComposing(false)}
      onCompositionStart={() => setComposing(true)}
    >
      <Autocomplete
        aria-label="資材の検索条件"
        emptyMessage={keyword.length > 0 ? `「${keyword}」に一致する候補がありません` : undefined}
        filterMode="preFiltered"
        onPick={(option) => {
          const next = suggestionOf(option);
          if (next !== undefined) navigate([...selected, next], "");
        }}
        onSubmitText={(text) => {
          if (text.trim() !== initialQuery) navigate(selected, text);
        }}
        onValueChange={(value) => setInput({ ...input, value })}
        options={suggestions.map((filter) => ({
          value: selectedFilterKey(filter),
          label: filter.name,
          description: TAG_CATEGORY_LABELS[selectedFilterCategory(filter)],
        }))}
        placeholder="作物・悩み・資材名を入力してください"
        renderOption={(option) => {
          const filter = suggestionOf(option);
          return (
            <>
              <span
                className={categoryLabelRecipe({
                  category: filter === undefined ? undefined : selectedFilterCategory(filter),
                })}
              >
                {option.description}
              </span>
              <span>{option.label}</span>
            </>
          );
        }}
        size="search"
        value={query}
      />

      {selected.length > 0 ? (
        <div className={css({ display: "flex", flexWrap: "wrap", gap: "2", mt: "2.5" })}>
          {selected.map((filter, index) => (
            <Chip
              category={TAG_CATEGORY_LABELS[selectedFilterCategory(filter)]}
              key={selectedFilterKey(filter)}
              onRemove={() => navigate(selected.filter((_, itemIndex) => itemIndex !== index))}
              removeLabel={`${filter.name}を外す`}
              size="md"
            >
              {filter.name}
            </Chip>
          ))}
        </div>
      ) : null}
    </div>
  );
}
