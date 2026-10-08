"use client";

import { Icon } from "@/components/Icon";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { TAG_CATEGORY_LABELS } from "@/components/TagChip";
import {
  buildSearchHref,
  searchFilterItemToSelected,
  selectedFilterCategory,
  selectedFilterKey,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";
import type { SearchCatalog, SearchFilterItem } from "@/lib/material-search";
import { css, cva } from "../../../../styled-system/css";

import { chipCategoryStyle, chipRemoveRecipe, selectedChipRecipe } from "./search-chips";

type SearchBoxProps = {
  initialQuery: string;
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  catalog: SearchCatalog;
};

type Suggestion =
  | { kind: "filter"; filter: SearchFilterItem }
  | { kind: "maker"; name: string }
  | { kind: "name"; name: string };

const SUGGESTION_LIMIT = 8;

function toSelected(suggestion: Suggestion): SelectedSearchFilter {
  if (suggestion.kind === "filter") return searchFilterItemToSelected(suggestion.filter);
  if (suggestion.kind === "maker") return { kind: "maker", name: suggestion.name };
  return { kind: "name", name: suggestion.name };
}

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

const searchBoxStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  py: "3",
  px: "3",
  bg: "surface.card",
  borderWidth: "1.5px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "button",
  _focusWithin: {
    borderColor: "primary.700",
    boxShadow: "0 0 0 3px token(colors.primary.700/16)",
  },
});

const inputStyle = css({
  flex: "1",
  minW: "0",
  borderWidth: "0",
  bg: "transparent",
  color: "text.default",
  fontSize: "md",
  outline: "none",
  _placeholder: { color: "text.subtle" },
});

const suggestionStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  w: "full",
  py: "2",
  px: "1.5",
  borderWidth: "0",
  borderRadius: "input",
  bg: "transparent",
  color: "inherit",
  fontSize: "md",
  textAlign: "left",
  cursor: "pointer",
  _hover: { bg: "primary.soft" },
  _active: { bg: "primary.soft" },
});

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

  const addSuggestion = (suggestion: Suggestion) => {
    const next = toSelected(suggestion);
    if (selectedKeys.has(selectedFilterKey(next))) return;
    navigate([...selected, next], "");
  };

  const suggestions = useMemo((): Suggestion[] => {
    const keyword = normalize(query.trim());
    if (keyword.length === 0) return [];
    const found: Suggestion[] = [];
    for (const filter of catalog.filters) {
      if (selectedKeys.has(`${filter.category}:${filter.id}`)) continue;
      if ([filter.name, ...filter.aliases].some((name) => normalize(name).includes(keyword)))
        found.push({ kind: "filter", filter });
      if (found.length >= SUGGESTION_LIMIT) return found;
    }
    for (const name of catalog.materialNames) {
      if (selectedKeys.has(`name:${name}`)) continue;
      if (normalize(name).includes(keyword)) found.push({ kind: "name", name });
      if (found.length >= SUGGESTION_LIMIT) return found;
    }
    for (const name of catalog.makers) {
      if (selectedKeys.has(`maker:${name}`)) continue;
      if (normalize(name).includes(keyword)) found.push({ kind: "maker", name });
      if (found.length >= SUGGESTION_LIMIT) return found;
    }
    return found;
  }, [catalog, query, selectedKeys]);

  return (
    <div aria-busy={isPending || undefined}>
      <div className={searchBoxStyle}>
        <span className={css({ display: "flex", color: "text.subtle" })}>
          <Icon name="search" size="sm" />
        </span>
        <input
          aria-label="資材の検索条件"
          autoComplete="off"
          className={inputStyle}
          onChange={(event) => setInput({ ...input, value: event.target.value })}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          placeholder="作物・悩み・資材名を入力してください"
          value={query}
        />
      </div>

      {selected.length > 0 ? (
        <div className={css({ display: "flex", flexWrap: "wrap", gap: "2", mt: "2.5" })}>
          {selected.map((filter, index) => (
            <span className={selectedChipRecipe({ size: "md" })} key={selectedFilterKey(filter)}>
              <span className={chipCategoryStyle}>
                {TAG_CATEGORY_LABELS[selectedFilterCategory(filter)]}
              </span>
              {filter.name}
              <button
                type="button"
                className={chipRemoveRecipe({ size: "md" })}
                aria-label={`${filter.name}を外す`}
                onClick={() => navigate(selected.filter((_, itemIndex) => itemIndex !== index))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {query.trim().length > 0 ? (
        <div
          className={css({
            mt: "2.5",
            overflow: "hidden",
            bg: "surface.card",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "border.default",
            borderRadius: "button",
            boxShadow: "shadow",
          })}
        >
          {suggestions.length > 0 ? (
            <div className={css({ p: "3" })}>
              {suggestions.map((suggestion) => {
                const next = toSelected(suggestion);
                const category = selectedFilterCategory(next);
                return (
                  <button
                    className={suggestionStyle}
                    key={selectedFilterKey(next)}
                    onClick={() => addSuggestion(suggestion)}
                    type="button"
                  >
                    <span className={categoryLabelRecipe({ category })}>
                      {TAG_CATEGORY_LABELS[category]}
                    </span>
                    <span>{next.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className={css({
                p: "3.5",
                color: "text.subtle",
                fontSize: "md",
                textAlign: "center",
              })}
            >
              「{query.trim()}」に一致する候補がありません
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
