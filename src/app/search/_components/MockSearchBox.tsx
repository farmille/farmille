"use client";

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

type MockSearchBoxProps = {
  /** URL の q。候補表示と資材一覧に共通の検索文字。 */
  initialQuery: string;
  selected: SelectedSearchFilter[];
  sort: MaterialSortParam;
  catalog: SearchCatalog;
};

type Suggestion =
  | { kind: "filter"; filter: SearchFilterItem }
  | { kind: "maker"; name: string }
  | { kind: "name"; name: string };

/** 見本の候補は8件まで。 */
const SUGGESTION_LIMIT = 8;

function toSelected(suggestion: Suggestion): SelectedSearchFilter {
  if (suggestion.kind === "filter") return searchFilterItemToSelected(suggestion.filter);
  if (suggestion.kind === "maker") return { kind: "maker", name: suggestion.name };
  return { kind: "name", name: suggestion.name };
}

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

/** 見本の SEARCH_ICON。 */
function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

/**
 * 見本 S.search の検索窓（`.ts-box`）・選択中の条件（`.ts-chips`）・候補（`.ts-panel`）。
 * 動き（URL の q・filters・sort の更新、日本語変換中は検索しない、300ms 待ってから反映）は
 * 共通部品 MaterialSearchBox と同じ。見た目だけを見本のクラスで組む。
 */
export function MockSearchBox({ initialQuery, selected, sort, catalog }: MockSearchBoxProps) {
  const router = useRouter();
  const [input, setInput] = useState<{ value: string; urlQuery: string; requested: string | null }>(
    { value: initialQuery, urlQuery: initialQuery, requested: null },
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
      <div className="ts-box">
        <span className="ts-ic">
          <SearchIcon />
        </span>
        <input
          aria-label="資材の検索条件"
          autoComplete="off"
          className="ts-input"
          onChange={(event) => setInput({ ...input, value: event.target.value })}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          placeholder="作物・悩み・資材名を入力してください"
          value={query}
        />
      </div>

      {selected.length > 0 ? (
        <div className="ts-chips">
          {selected.map((filter, index) => (
            <span className="chip-sel" key={selectedFilterKey(filter)}>
              <span className="cat-mini">
                {TAG_CATEGORY_LABELS[selectedFilterCategory(filter)]}
              </span>
              {filter.name}
              <button
                type="button"
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
        <div className="ts-panel">
          {suggestions.length > 0 ? (
            <div className="ts-pg">
              {suggestions.map((suggestion) => {
                const next = toSelected(suggestion);
                const category = selectedFilterCategory(next);
                return (
                  <button
                    className="sug"
                    key={selectedFilterKey(next)}
                    onClick={() => addSuggestion(suggestion)}
                    type="button"
                  >
                    <span className="cat-label" data-cat={category}>
                      {TAG_CATEGORY_LABELS[category]}
                    </span>
                    <span>{next.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="ts-empty">「{query.trim()}」に一致する候補がありません</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
