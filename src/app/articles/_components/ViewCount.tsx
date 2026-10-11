import { Icon } from "@/components/Icon";
import { cva, cx } from "../../../../styled-system/css";

const viewCountRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    color: "text.subtle",
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  variants: {
    size: {
      md: { fontSize: "sm", gap: "1.5" },
      sm: { textStyle: "note", gap: "1" },
    },
  },
  defaultVariants: { size: "md" },
});

export function ViewCount({
  count,
  size,
  className,
}: {
  count: number;
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <span className={cx(viewCountRecipe({ size }), className)} aria-label={`${count}回閲覧`}>
      <Icon name="visibility" size="xs" /> <span>{count.toLocaleString("ja-JP")}</span>
    </span>
  );
}
