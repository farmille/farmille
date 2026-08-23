"use client";

import { TAG_CATEGORY_LABELS, type TagCategory } from "@/lib/tag-categories";
import { cva, css, cx, type RecipeVariantProps } from "../../styled-system/css";

export { TAG_CATEGORY_LABELS, toTagChipCategory } from "@/lib/tag-categories";
export type { TagCategory } from "@/lib/tag-categories";

const chipRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    borderRadius: "pill",
    fontWeight: "600",
    whiteSpace: "nowrap",
    borderWidth: "1px",
    borderStyle: "solid",
  },
  variants: {
    appearance: {
      /** 検索の選択済みチップ（chip-sel） */
      selected: {
        fontSize: "sm",
        pl: "2.5",
        pr: "1.5",
        py: "1",
      },
      /** 簡易チップ（.chip） */
      plain: {
        fontSize: "xs",
        px: "2.5",
        py: "0.5",
      },
      /** 候補ピル（未選択） */
      suggestion: {
        fontSize: "sm",
        px: "3",
        py: "1.5",
        bg: "surface.card",
        color: "text.muted",
        borderColor: "border.strong",
      },
    },
    category: {
      crop: {
        bg: "brand.soft",
        color: "brand.primaryDeep",
        borderColor: "brand.primary/30",
      },
      concern: {
        bg: "tag.concern/12",
        color: "tag.concern",
        borderColor: "tag.concern/35",
      },
      effect: {
        bg: "tag.effect/12",
        color: "tag.effect",
        borderColor: "tag.effect/35",
      },
      cond: {
        bg: "brand.soft",
        color: "accent.official",
        borderColor: "accent.official/30",
      },
      type: {
        bg: "tag.type/12",
        color: "tag.type",
        borderColor: "tag.type/35",
      },
      maker: {
        bg: "surface.page",
        color: "text.subtle",
        borderColor: "border.default",
      },
      name: {
        bg: "tag.name/12",
        color: "tag.name",
        borderColor: "tag.name/35",
      },
    },
    selectedOn: {
      true: {
        bg: "brand.primary",
        color: "surface.card",
        borderColor: "brand.primary",
        fontWeight: "600",
      },
      false: {},
    },
  },
  defaultVariants: {
    appearance: "selected",
    category: "crop",
    selectedOn: false,
  },
});

const catMini = css({
  fontSize: "2xs",
  opacity: "0.65",
  fontWeight: "700",
});

const removeBtn = css({
  borderWidth: "0",
  bg: "brand.primary/18",
  color: "brand.primaryDeep",
  w: "17px",
  h: "17px",
  borderRadius: "pill",
  display: "grid",
  placeItems: "center",
  fontSize: "sm",
  lineHeight: "1",
  cursor: "pointer",
  padding: "0",
});

export type TagChipVariants = RecipeVariantProps<typeof chipRecipe>;

type TagChipProps = {
  label: string;
  category?: TagCategory;
  appearance?: "selected" | "plain" | "suggestion";
  /** suggestion 時の選択ハイライト */
  selected?: boolean;
  showCategoryLabel?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
};

/** 分類色付きタグチップ。選択状態・×削除。 */
export function TagChip({
  label,
  category = "crop",
  appearance = "selected",
  selected = false,
  showCategoryLabel,
  onRemove,
  onClick,
  className,
}: TagChipProps) {
  const showCat = showCategoryLabel ?? (appearance === "selected" && category !== undefined);
  const Comp = onClick ? "button" : "span";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      className={cx(
        chipRecipe({
          appearance,
          category: appearance === "suggestion" && !selected ? undefined : category,
          selectedOn: appearance === "suggestion" ? selected : false,
        }),
        className,
      )}
      onClick={onClick}
    >
      {showCat ? <span className={catMini}>{TAG_CATEGORY_LABELS[category]}</span> : null}
      {label}
      {onRemove ? (
        <button
          type="button"
          className={removeBtn}
          aria-label={`${label}を削除`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      ) : null}
    </Comp>
  );
}

export { chipRecipe };
