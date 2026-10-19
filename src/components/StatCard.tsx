import { css, cx } from "../../styled-system/css";
import { surfaceCardRecipe } from "./SurfaceCard";

const cardRecipe = css({ textAlign: "center" });

type StatCardProps = {
  value: string | number;
  label: string;
  className?: string;
};

/** 実績カード。大きな緑数字＋ラベル。 */
export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div className={cx(surfaceCardRecipe({ padding: "compact" }), cardRecipe, className)}>
      <div
        className={css({
          fontSize: "2xl",
          fontWeight: "extrabold",
          color: "text.brand",
          fontVariantNumeric: "tabular-nums",
        })}
      >
        {value}
      </div>
      <div className={css({ fontSize: "2xs", color: "text.muted", mt: "0.5" })}>{label}</div>
    </div>
  );
}
