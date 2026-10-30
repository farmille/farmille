"use client";

import { useQueryStates } from "nuqs";
import { useReducer, useRef, useTransition } from "react";

import {
  encodeFiltersQuery,
  type MaterialSortParam,
  type SelectedSearchFilter,
} from "@/components/search/search-selection";
import { useMountEffect } from "@/lib/hooks/use-mount-effect";
import { materialSearchParsers } from "@/lib/search-query-state";

type SearchText = {
  text: string;
  /** 入力欄へ反映済みのURLの検索語。 */
  synced: string;
  /** 送ったがまだURLに届いていない検索語。古い順。 */
  requested: string[];
};

type SearchTextAction =
  | { type: "input"; text: string }
  | { type: "request"; text: string }
  | { type: "url"; query: string };

function reduceSearchText(state: SearchText, action: SearchTextAction): SearchText {
  switch (action.type) {
    case "input":
      return { ...state, text: action.text };
    case "request":
      return {
        ...state,
        text: action.text,
        requested: [...state.requested, action.text.trim()],
      };
    case "url": {
      // 自分で送った検索の応答では、待っている間に入力した続きを戻さない。
      const index = state.requested.indexOf(action.query);

      if (index === -1) return { text: action.query, synced: action.query, requested: [] };

      return {
        ...state,
        synced: action.query,
        requested: state.requested.slice(index + 1),
      };
    }
  }
}

const DEBOUNCE_MS = 300;

export function useMaterialSearch(initialQuery: string, sort: MaterialSortParam) {
  const [{ text: query, synced }, dispatch] = useReducer(reduceSearchText, {
    text: initialQuery,
    synced: initialQuery,
    requested: [],
  });

  if (synced !== initialQuery) dispatch({ type: "url", query: initialQuery });

  const composing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useMountEffect(() => () => clearTimeout(timer.current));

  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useQueryStates(materialSearchParsers, {
    shallow: false,
    scroll: false,
    startTransition,
  });

  const scheduleSearch = (value: string) => {
    clearTimeout(timer.current);

    // 応答待ちの間は initialQuery が古いので、送った直後の検索語と比べる。
    if (composing.current || value.trim() === search.q) return;
    const scheduledQuery = search.q;
    timer.current = setTimeout(() => {
      let sent = false;
      // 待つ間に「戻る」などで検索語が変わっていたら送らない。絞り込みと並び順は書き換えない。
      void setSearch(
        (current) => {
          if (current.q !== scheduledQuery) return {};
          sent = true;

          return { q: value.trim() };
        },
        { history: "replace" },
      );

      if (sent) dispatch({ type: "request", text: value });
    }, DEBOUNCE_MS);
  };

  return {
    query,
    isPending,
    setQuery: (value: string) => {
      dispatch({ type: "input", text: value });
      scheduleSearch(value);
    },
    onCompositionStart: () => {
      composing.current = true;
      clearTimeout(timer.current);
    },
    // 入力部品は変換確定時に onValueChange を呼ぶので、その前（capture）に変換中を解く。
    onCompositionEndCapture: () => {
      composing.current = false;
    },
    navigate: (filters: SelectedSearchFilter[], nextQuery = query) => {
      clearTimeout(timer.current);
      // URLの検索語が変わらないときは応答を待たない。
      dispatch({
        type: nextQuery.trim() === search.q ? "input" : "request",
        text: nextQuery,
      });
      void setSearch(
        { filters: encodeFiltersQuery(filters), sort, q: nextQuery.trim() },
        { history: "push" },
      );
    },
  };
}
