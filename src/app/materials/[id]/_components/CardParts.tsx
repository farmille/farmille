import { Icon } from "@/components/Icon";
import { css, cva, cx } from "../../../../../styled-system/css";

const starsStyle = css({ color: "accent.star", fontSize: "md" });

export function Stars({ value }: { value: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span className={starsStyle} role="img" aria-label={`5段階中${filled}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name={n <= filled ? "star_filled" : "star"} size="sm" />
      ))}
    </span>
  );
}

const noImageStyle = css({
  w: "full",
  h: "full",
  minH: "12",
  display: "grid",
  placeItems: "center",
  color: "text.subtle",
  fontSize: "2xs",
  fontWeight: "bold",
  bg: "surface.page",
  borderRadius: "input",
});

export function NoImage({ className }: { className?: string }) {
  return (
    <div className={cx(noImageStyle, className)} aria-hidden="true">
      NO IMAGE
    </div>
  );
}

const chipRecipe = cva({
  base: {
    fontSize: "xs",
    px: "2",
    py: "0.5",
    borderRadius: "pill",
    fontWeight: "semibold",
  },
  variants: {
    tone: {
      green: { bg: "primary.100", color: "text.brandOnSoft" },
      grey: {
        bg: "surface.page",
        color: "text.muted",
        borderWidth: "1px",
        borderColor: "border.default",
      },
    },
    wrap: {
      false: { whiteSpace: "nowrap" },
      true: { whiteSpace: "normal", minW: "0", maxW: "full", overflowWrap: "anywhere" },
    },
  },
  defaultVariants: { tone: "green", wrap: false },
});

export function Chip({
  children,
  tone,
  wrap,
}: {
  children: React.ReactNode;
  tone?: "grey";
  wrap?: boolean;
}) {
  return <span className={chipRecipe({ tone, wrap })}>{children}</span>;
}
