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
      soft: { bg: "primary.100", color: "text.brandOnSoft" },
      solid: { bg: "primary.700", color: "text.inverse" },
    },
    entrance: {
      true: {
        transitionProperty: "[opacity, transform]",
        transitionDuration: "dialog",
        transitionTimingFunction: "out",
        _starting: { opacity: "0", _motionSafe: { transform: "scale(0.9)" } },
      },
      false: {},
    },
  },
  defaultVariants: { tone: "soft", entrance: false },
});

export const completionStepRecipe = cva({
  base: {
    transitionProperty: "[opacity, transform]",
    transitionDuration: "dialog",
    transitionTimingFunction: "out",
    _starting: { opacity: "0", _motionSafe: { transform: "translateY({spacing.2})" } },
  },
  variants: {
    step: {
      1: { _motionSafe: { transitionDelay: "[calc({durations.stagger} * 1)]" } },
      2: { _motionSafe: { transitionDelay: "[calc({durations.stagger} * 2)]" } },
      3: { _motionSafe: { transitionDelay: "[calc({durations.stagger} * 3)]" } },
    },
  },
});

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
