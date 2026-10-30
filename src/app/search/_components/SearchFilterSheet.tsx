"use client";

import { useReducer, type ReactNode } from "react";

import { Dialog, DialogClose } from "@/components/Dialog";
import { TextLink } from "@/components/TextLink";
import { Icon } from "@/components/Icon";
import { css } from "../../../../styled-system/css";

import { FilterFocusContext } from "./filter-focus";
import { chipListStyle, chipRecipe } from "./search-chips";

export type FilterCategory = {
  key: string;
  label: string;
  /** その区分で選んでいる条件の数。 */
  count: number;
};

/**
 * スマホとタブレットの絞り込み。検索結果の上には「絞り込み」と区分のチップを折り返して全部並べ、条件の一覧はシートで開く。
 * 区分のチップから開くと、その区分を開いた状態で出す。シートの上には結果画面と同じ検索欄を置く。シートの下には「N件を表示する」を固定し、
 * 条件を選ぶたびに件数が変わる。PC では出さない。
 */
export function SearchFilterSheet({
  categories,
  resultCount,
  searchBox,
  children,
}: {
  categories: FilterCategory[];
  resultCount: number;
  /** シートの上に置く、結果画面と同じ検索欄。 */
  searchBox: ReactNode;
  children: ReactNode;
}) {
  const [{ open, focus }, dispatch] = useReducer(
    (
      state: { open: boolean; focus: string | null },
      event: { type: "open"; focus: string | null } | { type: "toggle"; open: boolean },
    ) =>
      event.type === "open" ? { open: true, focus: event.focus } : { ...state, open: event.open },
    { open: false, focus: null },
  );

  const conditionCount = categories.reduce((sum, category) => sum + category.count, 0);

  function show(key: string | null) {
    dispatch({ type: "open", focus: key });
  }

  return (
    <div className={css({ pc: { display: "none" } })}>
      <div className={chipListStyle}>
        <button
          type="button"
          className={chipRecipe({ active: conditionCount > 0, size: "md" })}
          onClick={() => show(null)}
        >
          <Icon name="tune" size="sm" />
          絞り込み{conditionCount > 0 ? `（${conditionCount}）` : null}
        </button>
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            className={chipRecipe({ active: category.count > 0, size: "md" })}
            onClick={() => show(category.key)}
          >
            {category.label}
            {category.count > 0 ? `（${category.count}）` : null}
            <Icon name="expand_more" size="xs" />
          </button>
        ))}
      </div>
      {conditionCount > 0 ? (
        <TextLink href="/search" variant="plain" className={css({ mt: "1.5" })}>
          すべての条件をクリア
        </TextLink>
      ) : null}
      <Dialog
        size="sheet"
        title="絞り込み"
        open={open}
        onOpenChange={(open) => dispatch({ type: "toggle", open })}
        footer={
          <>
            <TextLink href="/search" variant="plain">
              すべて解除
            </TextLink>
            <DialogClose variant="primary" className={css({ w: "auto" })}>
              {resultCount}件を表示する
            </DialogClose>
          </>
        }
      >
        <div className={css({ mb: "2" })}>{searchBox}</div>
        <FilterFocusContext value={focus}>{children}</FilterFocusContext>
      </Dialog>
    </div>
  );
}
