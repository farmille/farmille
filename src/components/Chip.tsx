import type { ReactNode } from "react";

import { Icon } from "./Icon";
import { cx, sva } from "../../styled-system/css";

export const chipRecipe = sva({
  slots: ["root", "category", "remove"],
  base: {
    root: {
      display: "inline-flex",
      alignItems: "center",
      gap: "1.5",
      maxW: "100%",
      py: "1",
      pl: "3",
      pr: "3",
      bg: "primary.100",
      color: "text.brandOnSoft",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: "primary.700/30",
      borderRadius: "pill",
      fontWeight: "semibold",
      lineHeight: "normal",
      overflowWrap: "anywhere",
      outline: "none",
      // Combobox の中では矢印キーでチップへフォーカスが移る
      _focusVisible: {
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "primary.700",
        outlineOffset: "1px",
      },
    },
    category: { flexShrink: "0", fontSize: "2xs", fontWeight: "bold", opacity: "0.65" },
    remove: {
      position: "relative",
      display: "grid",
      placeItems: "center",
      flexShrink: "0",
      p: "0",
      borderWidth: "0",
      borderRadius: "pill",
      bg: "primary.700/18",
      color: "text.brandOnSoft",
      cursor: "pointer",
      _focusVisible: {
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "primary.700",
        outlineOffset: "1px",
      },
      _after: { content: '""', position: "absolute", inset: "-1" },
    },
  },
  variants: {
    size: {
      md: { root: { fontSize: "md" }, remove: { w: "4.5", h: "4.5" } },
      sm: { root: { fontSize: "sm" }, remove: { w: "4", h: "4" } },
    },
    removable: {
      true: { root: { pr: "1.5" } },
      false: {},
    },
  },
  defaultVariants: { size: "sm", removable: false },
});

type ChipProps = {
  children: ReactNode;
  /** 名前の前に小さく添える種類（作物・効果など）。 */
  category?: string;
  size?: "md" | "sm";
  className?: string;
} & (
  | {
      onRemove: () => void;
      /** 外すボタンの読み上げ名（例：「トマトを削除」）。 */
      removeLabel: string;
    }
  | { onRemove?: undefined; removeLabel?: undefined }
);

/** 選択済みの項目を示すチップ。onRemove を渡すと外すボタンが付く。 */
export function Chip({ children, category, size, className, onRemove, removeLabel }: ChipProps) {
  const styles = chipRecipe({ size, removable: onRemove !== undefined });
  return (
    <span className={cx(styles.root, className)}>
      {category === undefined ? null : <span className={styles.category}>{category}</span>}
      {children}
      {onRemove === undefined ? null : (
        <button aria-label={removeLabel} className={styles.remove} onClick={onRemove} type="button">
          <Icon name="close" size="2xs" />
        </button>
      )}
    </span>
  );
}
