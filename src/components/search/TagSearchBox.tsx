"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { TagChip, TAG_CATEGORY_LABELS, type TagCategory } from "@/components/TagChip";
import { SearchIcon } from "@/components/Icons";
import type { TagListItem } from "@/server/queries/tags";
import { css } from "../../../styled-system/css";
import {
  buildSearchHref,
  selectedTagCategory,
  selectedTagKey,
  tagListItemToSelected,
  type MaterialSortParam,
  type SelectedSearchTag,
} from "./tag-selection";

type TagSearchBoxProps = {
  selected: SelectedSearchTag[];
  sort: MaterialSortParam;
  popular: TagListItem[];
  seasonal: TagListItem[];
  catalog: {
    tags: TagListItem[];
    makers: string[];
    materialNames: string[];
  };
  /** home では選択変更で /search へ遷移。search では同一ページのクエリを更新。 */
  variant: "home" | "search";
  placeholder?: string;
};

type Suggestion =
  | { kind: "tag"; tag: TagListItem }
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
    borderColor: "brand.primary",
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineColor: "brand.soft",
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

const clearBtn = css({
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
  borderRadius: "button",
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
  textTransform: "uppercase",
  m: "0",
  mb: "2",
  fontWeight: "700",
});

const sugChips = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "2",
});

const sugRow = css({
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
  _hover: { bg: "green.soft2" },
});

const catLabel = css({
  fontSize: "2xs",
  px: "1.5",
  py: "0.5",
  borderRadius: "button",
  fontWeight: "700",
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
      return css({ bg: "brand.primary/15", color: "brand.primaryDeep" });
    case "concern":
      return css({ bg: "tag.concern/15", color: "tag.concern" });
    case "effect":
      return css({ bg: "tag.effect/15", color: "tag.effect" });
    case "cond":
      return css({ bg: "accent.official/15", color: "accent.official" });
    case "type":
      return css({ bg: "tag.type/15", color: "tag.type" });
    case "maker":
      return css({ bg: "text.subtle/15", color: "text.subtle" });
    case "name":
      return css({ bg: "tag.name/15", color: "tag.name" });
  }
}

function toSelected(suggestion: Suggestion): SelectedSearchTag {
  if (suggestion.kind === "tag") return tagListItemToSelected(suggestion.tag);
  if (suggestion.kind === "maker") return { kind: "maker", name: suggestion.name };
  return { kind: "name", name: suggestion.name };
}

function suggestionKey(suggestion: Suggestion): string {
  return selectedTagKey(toSelected(suggestion));
}

export function TagSearchBox({
  selected,
  sort,
  popular,
  seasonal,
  catalog,
  variant,
  placeholder = "作物・悩み・資材名を入力",
}: TagSearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedKeys = useMemo(() => new Set(selected.map(selectedTagKey)), [selected]);

  const navigate = (nextTags: SelectedSearchTag[], nextSort: MaterialSortParam = sort) => {
    const href = buildSearchHref({ tags: nextTags, sort: nextSort });
    startTransition(() => {
      router.push(href);
    });
  };

  const addSuggestion = (suggestion: Suggestion) => {
    const next = toSelected(suggestion);
    if (selectedKeys.has(selectedTagKey(next))) return;
    setQuery("");
    navigate([...selected, next]);
  };

  const removeAt = (index: number) => {
    navigate(selected.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    navigate([]);
  };

  const filteredSuggestions = useMemo((): Suggestion[] => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];

    const out: Suggestion[] = [];

    for (const tag of catalog.tags) {
      if (selectedKeys.has(`tag:${tag.id}`)) continue;
      if (tag.name.toLowerCase().includes(q)) {
        out.push({ kind: "tag", tag });
      }
      if (out.length >= 8) return out;
    }

    for (const name of catalog.materialNames) {
      if (selectedKeys.has(`name:${name}`)) continue;
      if (name.toLowerCase().includes(q)) {
        out.push({ kind: "name", name });
      }
      if (out.length >= 8) return out;
    }

    for (const maker of catalog.makers) {
      if (selectedKeys.has(`maker:${maker}`)) continue;
      if (maker.toLowerCase().includes(q)) {
        out.push({ kind: "maker", name: maker });
      }
      if (out.length >= 8) return out;
    }

    return out;
  }, [catalog, query, selectedKeys]);

  const popularAvailable = popular.filter((tag) => !selectedKeys.has(`tag:${tag.id}`));
  const seasonalAvailable = seasonal.filter((tag) => !selectedKeys.has(`tag:${tag.id}`));
  const showDefaultPanel = query.trim().length === 0;

  return (
    <div aria-busy={isPending || undefined} data-variant={variant}>
      <div className={box}>
        <span className={css({ color: "text.subtle", display: "flex" })}>
          <SearchIcon />
        </span>
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="タグ検索"
        />
      </div>

      {selected.length > 0 ? (
        <div className={chipsRow}>
          {selected.map((tag, index) => (
            <TagChip
              key={selectedTagKey(tag)}
              label={tag.name}
              category={selectedTagCategory(tag)}
              appearance="selected"
              onRemove={() => removeAt(index)}
            />
          ))}
          <button type="button" className={clearBtn} onClick={clearAll}>
            すべて解除
          </button>
        </div>
      ) : null}

      <div className={panel}>
        {showDefaultPanel ? (
          <>
            <div className={panelGroup}>
              <h5 className={panelTitle}>よく探されている条件</h5>
              <div className={sugChips}>
                {popularAvailable.map((tag) => (
                  <TagChip
                    key={tag.id}
                    label={tag.name}
                    appearance="suggestion"
                    onClick={() => addSuggestion({ kind: "tag", tag })}
                  />
                ))}
              </div>
            </div>
            <div className={panelGroup}>
              <h5 className={panelTitle}>今の時期におすすめ</h5>
              <div className={sugChips}>
                {seasonalAvailable.map((tag) => (
                  <TagChip
                    key={tag.id}
                    label={tag.name}
                    appearance="suggestion"
                    onClick={() => addSuggestion({ kind: "tag", tag })}
                  />
                ))}
              </div>
            </div>
          </>
        ) : filteredSuggestions.length > 0 ? (
          <div className={panelGroup}>
            {filteredSuggestions.map((suggestion) => {
              const selectedLike = toSelected(suggestion);
              const category = selectedTagCategory(selectedLike);
              return (
                <button
                  key={suggestionKey(suggestion)}
                  type="button"
                  className={sugRow}
                  onClick={() => addSuggestion(suggestion)}
                >
                  <span className={`${catLabel} ${categoryAccentClass(category)}`}>
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
    </div>
  );
}
