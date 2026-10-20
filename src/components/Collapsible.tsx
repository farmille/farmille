import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import type { ReactNode } from "react";

import { Icon } from "./Icon";
import { cva, cx, sva } from "../../styled-system/css";

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
        outlineOffset: "0.5",
      },
    },
    icon: {
      flexShrink: "0",
      transitionProperty: "[transform]",
      transitionDuration: "fast",
      transitionTimingFunction: "out",
      "[data-panel-open] > &": { transform: "rotate(180deg)" },
      _motionReduce: { transitionProperty: "[none]" },
    },
  },
  variants: {
    variant: {
      section: {
        trigger: {
          display: "flex",
          gap: "2",
          w: "full",
          minH: "11",
          py: "1.5",
          px: "0.5",
          color: "[inherit]",
          fontSize: "md",
          fontWeight: "bold",
        },
        icon: { ml: "auto", color: "text.brand" },
      },
      link: {
        trigger: {
          display: "inline-flex",
          gap: "1",
          p: "0",
          color: "text.brand",
          fontSize: "sm",
          fontWeight: "semibold",
        },
      },
    },
  },
  defaultVariants: { variant: "section" },
});

const panelRecipe = cva({
  base: { h: "var(--collapsible-panel-height)", overflow: "hidden" },
  variants: {
    motion: {
      expand: {
        transitionProperty: "[height, opacity]",
        transitionDuration: "fast",
        transitionTimingFunction: "out",
        _startingStyle: { h: "0", opacity: "0" },
        _endingStyle: { h: "0", opacity: "0" },
        _motionReduce: { transitionProperty: "[opacity]" },
      },
      none: {},
    },
  },
  defaultVariants: { motion: "expand" },
});

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
  motion,
  children,
  className,
}: {
  hiddenUntilFound?: boolean;
  motion?: "expand" | "none";
  children: ReactNode;
  className?: string;
}) {
  return (
    <BaseCollapsible.Panel
      hiddenUntilFound={hiddenUntilFound}
      className={cx(panelRecipe({ motion }), className)}
    >
      {children}
    </BaseCollapsible.Panel>
  );
}
