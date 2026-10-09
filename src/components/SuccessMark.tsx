import { Icon } from "./Icon";
import { cva, cx } from "../../styled-system/css";

const successMarkRecipe = cva({
  base: {
    display: "grid",
    placeItems: "center",
    w: "20",
    h: "20",
    mx: "auto",
    borderRadius: "pill",
  },
  variants: {
    tone: {
      soft: { bg: "primary.100", color: "primary.700" },
      solid: { bg: "primary.700", color: "text.inverse" },
    },
    // 完了した瞬間だけ、印を少し小さい所から 250ms で置く。再訪で見る画面には付けない
    entrance: {
      true: {
        transitionProperty: "opacity, transform",
        transitionDuration: "dialog",
        transitionTimingFunction: "out",
        // 視覚過敏の設定では拡大を付けず、不透明度だけで出す
        _starting: { opacity: "0", _motionSafe: { transform: "scale(0.9)" } },
      },
      false: {},
    },
  },
  defaultVariants: { tone: "soft", entrance: false },
});

/**
 * 完了画面の見出し・本文・操作を、印のあとに 50ms ずつ遅らせて下から出す。
 * 視覚過敏の設定では位置を動かさず、遅らせずに不透明度だけで出す。
 */
export const completionStepRecipe = cva({
  base: {
    transitionProperty: "opacity, transform",
    transitionDuration: "dialog",
    transitionTimingFunction: "out",
    _starting: { opacity: "0", _motionSafe: { transform: "translateY({spacing.2})" } },
  },
  variants: {
    step: {
      1: { _motionSafe: { transitionDelay: "calc({durations.stagger} * 1)" } },
      2: { _motionSafe: { transitionDelay: "calc({durations.stagger} * 2)" } },
      3: { _motionSafe: { transitionDelay: "calc({durations.stagger} * 3)" } },
    },
  },
});

/** 申請・投稿の完了を示す 80px のチェック印。 */
export function SuccessMark({
  tone,
  entrance,
  className,
}: {
  tone?: "soft" | "solid";
  entrance?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cx(successMarkRecipe({ tone, entrance }), className)}>
      <Icon name="check" size="2xl" />
    </div>
  );
}
