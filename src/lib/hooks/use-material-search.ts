"use client";

import { useQueryStates } from "nuqs";
import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useReducer, useRef, useTransition } from "react";

import {
  encodeFiltersQuery,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";
import { materialSearchParsers } from "@/lib/search-query-state";

export function useMaterialSearch(
  initialQuery: string,
  selected: SelectedSearchFilter[],
  sort: MaterialSortParam,
) {
  const form = useForm({ defaultValues: { query: initialQuery } });
  const query = useStore(form.store, (state) => state.values.query);
  const [composing, setComposing] = useReducer((_current: boolean, next: boolean) => next, false);
  const requestedQuery = useRef<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [, setSearch] = useQueryStates(materialSearchParsers, {
    shallow: false,
    scroll: false,
    startTransition,
  });

  useEffect(() => {
    // 自分で送った検索の応答では、待っている間に入力した続きやフォーカスを戻さない。
    if (requestedQuery.current !== initialQuery && form.getFieldValue("query") !== initialQuery) {
      form.setFieldValue("query", initialQuery);
    }
    requestedQuery.current = null;
  }, [form, initialQuery]);

  useEffect(() => {
    if (composing || isPending || query.trim() === initialQuery) return;
    const timer = setTimeout(() => {
      requestedQuery.current = query.trim();
      void setSearch(
        { filters: encodeFiltersQuery(selected), sort, q: query.trim() },
        { history: "replace" },
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [composing, initialQuery, isPending, query, selected, sort, setSearch]);

  return {
    query,
    isPending,
    setQuery: (value: string) => form.setFieldValue("query", value),
    setComposing,
    navigate: (filters: SelectedSearchFilter[], nextQuery = query) => {
      form.setFieldValue("query", nextQuery);
      requestedQuery.current = nextQuery.trim();
      void setSearch(
        { filters: encodeFiltersQuery(filters), sort, q: nextQuery.trim() },
        { history: "push" },
      );
    },
  };
}
