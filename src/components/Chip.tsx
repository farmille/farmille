"use client";

import { Tooltip } from "@base-ui/react/tooltip";
import { useRef, useState, type ReactNode } from "react";

import { Icon } from "./Icon";
import { chipRecipe, chipTooltipStyle } from "./chip-recipe";
import { popupPositionerStyle } from "./popup";
import { css, cx } from "../../styled-system/css";

const visuallyHidden = css({ srOnly: true });

type ChipProps = {
  children: ReactNode;
  /** 名前の前に小さく添える種類（作物・効果など）。 */
  category?: string;
  /** children が略称のときの正式名称。ホバーで出し、読み上げにも使う。 */
  fullLabel?: string;
  tone?: "brand" | "neutral";
  size?: "md" | "sm" | "xs";
  className?: string;
} & (
  | {
      onRemove: () => void;
      /** 外すボタンの読み上げ名（例：「トマトを削除」）。 */
      removeLabel: string;
    }
  | { onRemove?: undefined; removeLabel?: undefined }
);

/** 1行に収まる名前のチップ。入りきらない名前は末尾を省略し、ホバーで全文を出す。onRemove を渡すと外すボタンが付く。 */
export function Chip({
  children,
  category,
  fullLabel,
  tone,
  size,
  className,
  onRemove,
  removeLabel,
}: ChipProps) {
  const styles = chipRecipe({ tone, size, removable: onRemove !== undefined });
  const labelRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  function handleOpenChange(next: boolean): void {
    const label = labelRef.current;
    const truncated = label !== null && label.scrollWidth > label.clientWidth;
    setOpen(next && (fullLabel !== undefined || truncated));
  }

  return (
    <span className={cx(styles.root, className)}>
      {category === undefined ? null : <span className={styles.category}>{category}</span>}
      <Tooltip.Root open={open} onOpenChange={handleOpenChange}>
        <Tooltip.Trigger delay={300} render={<span ref={labelRef} className={styles.label} />}>
          {fullLabel === undefined ? (
            children
          ) : (
            <>
              <span aria-hidden="true">{children}</span>
              <span className={visuallyHidden}>{fullLabel}</span>
            </>
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner className={popupPositionerStyle} sideOffset={6}>
            <Tooltip.Popup className={chipTooltipStyle}>{fullLabel ?? children}</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
      {onRemove === undefined ? null : (
        <button aria-label={removeLabel} className={styles.remove} onClick={onRemove} type="button">
          <Icon name="close" size="2xs" />
        </button>
      )}
    </span>
  );
}
