import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import type { ReactNode } from "react";

import { Icon } from "./Icon";
import { css, cx, sva } from "../../styled-system/css";

const triggerRecipe = sva({
  slots: ["trigger", "icon"],
  base: {
    trigger: {
      alignItems: "center",
      borderWidth: "0",
      bg: "transparent",
      fontFamily: "sans",
      textAlign: "left",
      cursor: "pointer",
      _focusVisible: {
        outlineWidth: "2px",
        outlineStyle: "solid",
        outlineColor: "primary.600",
        outlineOffset: "2px",
      },
    },
    // 開閉と同じ時間で1つの山形を半回転させ、開いている向きを示す
    icon: {
      flexShrink: "0",
      transitionProperty: "transform",
      transitionDuration: "fast",
      transitionTimingFunction: "out",
      "[data-panel-open] > &": { transform: "rotate(180deg)" },
      _motionReduce: { transitionProperty: "none" },
    },
  },
  variants: {
    variant: {
      // 見出し行全体を押せる区切り（検索の絞り込み欄など）
      section: {
        trigger: {
          display: "flex",
          gap: "2",
          w: "full",
          minH: "11",
          py: "1.5",
          px: "0.5",
          color: "inherit",
          fontSize: "md",
          fontWeight: "bold",
        },
        icon: { ml: "auto", color: "primary.700" },
      },
      // 本文中の「詳細を見る」のような控えめな開閉
      link: {
        trigger: {
          display: "inline-flex",
          gap: "1",
          p: "0",
          color: "primary.800",
          fontSize: "sm",
          fontWeight: "semibold",
        },
      },
    },
  },
  defaultVariants: { variant: "section" },
});

const panelStyle = css({
  h: "var(--collapsible-panel-height)",
  overflow: "hidden",
  transitionProperty: "height, opacity",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _startingStyle: { h: "0", opacity: "0" },
  _endingStyle: { h: "0", opacity: "0" },
  _motionReduce: { transitionProperty: "opacity" },
});

/** 開閉する領域のまとまり。開閉状態を持たせたいときだけ open / onOpenChange を渡す。 */
export function Collapsible({
  open,
  defaultOpen,
  onOpenChange,
  className,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <BaseCollapsible.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      className={className}
    >
      {children}
    </BaseCollapsible.Root>
  );
}

export function CollapsibleTrigger({
  variant = "section",
  children,
  className,
}: {
  variant?: "section" | "link";
  children: ReactNode;
  className?: string;
}) {
  const styles = triggerRecipe({ variant });
  return (
    <BaseCollapsible.Trigger className={cx(styles.trigger, className)}>
      {children}
      <Icon name="expand_more" size={variant === "section" ? "sm" : "xs"} className={styles.icon} />
    </BaseCollapsible.Trigger>
  );
}

/** 開閉する中身。hiddenUntilFound はページ内検索で見つかったときに自動で開く。 */
export function CollapsiblePanel({
  hiddenUntilFound,
  children,
  className,
}: {
  hiddenUntilFound?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <BaseCollapsible.Panel
      hiddenUntilFound={hiddenUntilFound}
      className={cx(panelStyle, className)}
    >
      {children}
    </BaseCollapsible.Panel>
  );
}
