"use client";

import { useQueryStates } from "nuqs";
import { useEffect, useReducer, useTransition } from "react";

import {
  encodeFiltersQuery,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";
import { materialSearchParsers } from "@/lib/search-query-state";

type SearchInput = {
  value: string;
  urlQuery: string;
  requested: string | null;
  composing: boolean;
};
type SearchEvent =
  | { type: "input"; value: string }
  | { type: "url"; query: string }
  | { type: "request"; query: string }
  | { type: "navigate"; query: string }
  | { type: "compose"; composing: boolean };

function searchInputReducer(state: SearchInput, event: SearchEvent): SearchInput {
  switch (event.type) {
    case "input":
      return { ...state, value: event.value };
    case "url":
      return {
        ...state,
        value: state.requested === event.query ? state.value : event.query,
        urlQuery: event.query,
        requested: null,
      };
    case "request":
      return { ...state, requested: event.query };
    case "navigate":
      return { ...state, value: event.query, requested: event.query.trim() };
    case "compose":
      return { ...state, composing: event.composing };
  }
}

export function useMaterialSearch(
  initialQuery: string,
  selected: SelectedSearchFilter[],
  sort: MaterialSortParam,
) {
  const [input, dispatch] = useReducer(searchInputReducer, {
    value: initialQuery,
    urlQuery: initialQuery,
    requested: null,
    composing: false,
  });
  const [isPending, startTransition] = useTransition();
  const [, setSearch] = useQueryStates(materialSearchParsers, {
    shallow: false,
    scroll: false,
    startTransition,
  });
  if (input.urlQuery !== initialQuery) dispatch({ type: "url", query: initialQuery });
  const { value: query, composing } = input;

  useEffect(() => {
    if (composing || isPending || query.trim() === initialQuery) return;
    const timer = setTimeout(() => {
      dispatch({ type: "request", query: query.trim() });
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
    setQuery: (value: string) => dispatch({ type: "input", value }),
    setComposing: (value: boolean) => dispatch({ type: "compose", composing: value }),
    navigate: (filters: SelectedSearchFilter[], nextQuery = query) => {
      dispatch({ type: "navigate", query: nextQuery });
      void setSearch(
        { filters: encodeFiltersQuery(filters), sort, q: nextQuery.trim() },
        { history: "push" },
      );
    },
  };
}
