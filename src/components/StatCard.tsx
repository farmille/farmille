import { cva, css } from "../../styled-system/css";

const cardRecipe = cva({
  base: {
    bg: "surface.card",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "button",
    p: "3",
    boxShadow: "shadow",
    textAlign: "center",
  },
});

type StatCardProps = {
  value: string | number;
  label: string;
  className?: string;
};

/** 実績カード。大きな緑数字＋ラベル。 */
export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div className={cardRecipe({ className })}>
      <div
        className={css({
          fontSize: "2xl",
          fontWeight: "800",
          color: "primary.700",
          fontVariantNumeric: "tabular-nums",
        })}
      >
        {value}
      </div>
      <div className={css({ fontSize: "2xs", color: "text.muted", mt: "0.5" })}>{label}</div>
    </div>
  );
}
