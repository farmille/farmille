"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { Icon } from "@/components/Icon";
import { TagChip, TAG_CATEGORY_LABELS, type TagCategory } from "@/components/TagChip";
import type { SearchCatalog, SearchFilterItem } from "@/lib/material-search";
import { css } from "../../../styled-system/css";
import {
  buildSearchHref,
  searchFilterItemToSelected,
  selectedFilterCategory,
  selectedFilterKey,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "./search-selection";

type MaterialSearchBoxProps = {
  /** URL の q。候補表示と資材一覧に共通の検索文字。 */
  initialQuery: string;
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  popular: SearchFilterItem[];
  seasonal: SearchFilterItem[];
  catalog: SearchCatalog;
  placeholder?: string;
};

type Suggestion =
  | { kind: "filter"; filter: SearchFilterItem }
  | { kind: "maker"; name: string }
  | { kind: "name"; name: string };

const box = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "button",
  px: "3.5",
  py: "2.5",
  _focusWithin: {
    borderColor: "primary.600",
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "primary.200",
  },
});

const inputClass = css({
  flex: "1",
  borderWidth: "0",
  bg: "transparent",
  color: "text.default",
  fontSize: "md",
  fontFamily: "sans",
  outline: "none",
  minW: "0",
  _placeholder: { color: "text.subtle" },
});

const chipsRow = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
  mt: "2.5",
});

const clearButton = css({
  borderWidth: "0",
  bg: "transparent",
  color: "text.subtle",
  fontSize: "sm",
  textDecoration: "underline",
  padding: "1",
  cursor: "pointer",
  fontFamily: "sans",
});

const panel = css({
  mt: "2.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
  overflow: "hidden",
});

const panelGroup = css({
  px: "3",
  py: "2.5",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  _first: { borderTopWidth: "0" },
});

const panelTitle = css({
  fontSize: "2xs",
  color: "text.subtle",
  letterSpacing: "0.04em",
  m: "0",
  mb: "2",
});

const suggestionChips = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const suggestionRow = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  px: "1.5",
  py: "2",
  borderRadius: "button",
  fontSize: "md",
  w: "100%",
  borderWidth: "0",
  bg: "transparent",
  color: "text.default",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "sans",
  _hover: { bg: "primary.soft" },
});

const categoryLabel = css({
  fontSize: "2xs",
  px: "1.5",
  py: "0.5",
  borderRadius: "input",
  fontWeight: "bold",
  whiteSpace: "nowrap",
  flexShrink: "0",
});

const emptyHint = css({
  px: "3.5",
  py: "3.5",
  textAlign: "center",
  color: "text.subtle",
  fontSize: "sm",
});

function categoryAccentClass(category: TagCategory): string {
  switch (category) {
    case "crop":
      return css({ bg: "primary.600/15", color: "primary.700" });
    case "concern":
      return css({ bg: "tag.concern/15", color: "tag.concern" });
    case "effect":
      return css({ bg: "tag.effect/15", color: "tag.effect" });
    case "cond":
      return css({ bg: "tag.cond/15", color: "tag.cond" });
    case "genre":
      return css({ bg: "tag.type/15", color: "tag.type" });
    case "maker":
      return css({ bg: "text.subtle/15", color: "text.subtle" });
    case "name":
      return css({ bg: "tag.name/15", color: "tag.name" });
  }
}

function toSelected(suggestion: Suggestion): SelectedSearchFilter {
  if (suggestion.kind === "filter") return searchFilterItemToSelected(suggestion.filter);
  if (suggestion.kind === "maker") return { kind: "maker", name: suggestion.name };
  return { kind: "name", name: suggestion.name };
}

function suggestionKey(suggestion: Suggestion): string {
  return selectedFilterKey(toSelected(suggestion));
}

export function MaterialSearchBox({
  initialQuery,
  selected,
  sort,
  popular,
  seasonal,
  catalog,
  placeholder = "作物・悩み・資材名を入力してください",
}: MaterialSearchBoxProps) {
  const router = useRouter();
  const [input, setInput] = useState<{ value: string; urlQuery: string; requested: string | null }>(
    {
      value: initialQuery,
      urlQuery: initialQuery,
      requested: null,
    },
  );
  const [composing, setComposing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const query = input.value;

  // 自分の検索結果が届いても入力中の文字は戻さない。履歴移動やヘッダー検索は反映する。
  if (input.urlQuery !== initialQuery) {
    setInput({
      value: input.requested === initialQuery ? input.value : initialQuery,
      urlQuery: initialQuery,
      requested: null,
    });
  }

  useEffect(() => {
    if (composing || isPending || query.trim() === initialQuery) return;
    // 日本語変換中は検索せず、入力が落ち着いてから件数と一覧を更新する。
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

  const addSuggestion = (suggestion: Suggestion) => {
    const next = toSelected(suggestion);
    if (selectedKeys.has(selectedFilterKey(next))) return;
    navigate([...selected, next], "");
  };

  const filteredSuggestions = useMemo((): Suggestion[] => {
    const normalizedQuery = query.trim().normalize("NFKC").toLowerCase();
    if (normalizedQuery.length === 0) return [];

    const suggestions: Suggestion[] = [];

    for (const filter of catalog.filters) {
      if (selectedKeys.has(`${filter.category}:${filter.id}`)) continue;
      const names = [filter.name, ...filter.aliases];
      if (names.some((name) => name.normalize("NFKC").toLowerCase().includes(normalizedQuery))) {
        suggestions.push({ kind: "filter", filter });
      }
      if (suggestions.length >= 8) return suggestions;
    }

    for (const name of catalog.materialNames) {
      if (selectedKeys.has(`name:${name}`)) continue;
      if (name.normalize("NFKC").toLowerCase().includes(normalizedQuery))
        suggestions.push({ kind: "name", name });
      if (suggestions.length >= 8) return suggestions;
    }

    for (const name of catalog.makers) {
      if (selectedKeys.has(`maker:${name}`)) continue;
      if (name.normalize("NFKC").toLowerCase().includes(normalizedQuery))
        suggestions.push({ kind: "maker", name });
      if (suggestions.length >= 8) return suggestions;
    }

    return suggestions;
  }, [catalog, query, selectedKeys]);

  const popularAvailable = popular.filter(
    (filter) => !selectedKeys.has(`${filter.category}:${filter.id}`),
  );
  const seasonalAvailable = seasonal.filter(
    (filter) => !selectedKeys.has(`${filter.category}:${filter.id}`),
  );
  const showDefaultPanel = query.trim().length === 0;

  return (
    <div aria-busy={isPending || undefined}>
      <div className={box}>
        <span className={css({ color: "text.subtle", display: "flex" })}>
          <Icon name="search" size="sm" />
        </span>
        <input
          aria-label="資材の検索条件"
          autoComplete="off"
          className={inputClass}
          onChange={(event) => setInput({ ...input, value: event.target.value })}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          placeholder={placeholder}
          value={query}
        />
      </div>

      {selected.length > 0 ? (
        <div className={chipsRow}>
          {selected.map((filter, index) => (
            <TagChip
              appearance="selected"
              category={selectedFilterCategory(filter)}
              key={selectedFilterKey(filter)}
              label={filter.name}
              onRemove={() => navigate(selected.filter((_, itemIndex) => itemIndex !== index))}
            />
          ))}
          <button className={clearButton} onClick={() => navigate([], "")} type="button">
            すべて解除
          </button>
        </div>
      ) : null}

      {(!showDefaultPanel || popularAvailable.length > 0 || seasonalAvailable.length > 0) && (
        <div className={panel}>
          {showDefaultPanel ? (
            <>
              <div className={panelGroup}>
                <h2 className={panelTitle}>よく探されている条件</h2>
                <div className={suggestionChips}>
                  {popularAvailable.map((filter) => (
                    <TagChip
                      appearance="suggestion"
                      key={`${filter.category}:${filter.id}`}
                      label={filter.name}
                      onClick={() => addSuggestion({ kind: "filter", filter })}
                    />
                  ))}
                </div>
              </div>
              <div className={panelGroup}>
                <h2 className={panelTitle}>今の時期におすすめ</h2>
                <div className={suggestionChips}>
                  {seasonalAvailable.map((filter) => (
                    <TagChip
                      appearance="suggestion"
                      key={`${filter.category}:${filter.id}`}
                      label={filter.name}
                      onClick={() => addSuggestion({ kind: "filter", filter })}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : filteredSuggestions.length > 0 ? (
            <div className={panelGroup}>
              {filteredSuggestions.map((suggestion) => {
                const selectedLike = toSelected(suggestion);
                const category = selectedFilterCategory(selectedLike);
                return (
                  <button
                    className={suggestionRow}
                    key={suggestionKey(suggestion)}
                    onClick={() => addSuggestion(suggestion)}
                    type="button"
                  >
                    <span className={`${categoryLabel} ${categoryAccentClass(category)}`}>
                      {TAG_CATEGORY_LABELS[category]}
                    </span>
                    <span>{selectedLike.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={emptyHint}>「{query.trim()}」に一致する候補がありません</div>
          )}
        </div>
      )}
    </div>
  );
}
