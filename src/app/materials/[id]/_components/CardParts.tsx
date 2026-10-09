import { OptimizedImage as Image } from "@/components/OptimizedImage";

import { css, cva, cx } from "../../../../../styled-system/css";

const starsStyle = css({ color: "accent.star", fontSize: "md" });

export function Stars({ value }: { value: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span className={starsStyle} role="img" aria-label={`5段階中${filled}`}>
      {"★".repeat(filled)}
      {"☆".repeat(5 - filled)}
    </span>
  );
}

function initials(name: string): string {
  const text = name.trim();
  if (!text) return "?";
  const body = text.replace(/^(株式会社|有限会社|農事組合法人|一般社団法人)/, "").trim();
  return (body || text).slice(0, 1).toUpperCase();
}

const avatarRecipe = cva({
  base: {
    display: "inline-grid",
    placeItems: "center",
    flex: "none",
    overflow: "hidden",
    borderRadius: "pill",
    borderWidth: "1px",
    borderColor: "primary.700/22",
    bg: "primary.100",
    color: "primary.800",
    fontWeight: "bold",
    lineHeight: "none",
    letterSpacing: "0.02em",
  },
  variants: {
    size: {
      md: { w: "9", h: "9", fontSize: "md" },
      sm: { w: "8", h: "8", fontSize: "sm" },
      xs: { w: "6.5", h: "6.5", fontSize: "xs" },
      "2xs": { w: "4.5", h: "4.5", fontSize: "xs" },
    },
  },
  defaultVariants: { size: "md" },
});

type AvatarSize = "md" | "sm" | "xs" | "2xs";

const AVATAR_PIXELS = { md: 36, sm: 32, xs: 26, "2xs": 18 } satisfies Record<AvatarSize, number>;

function avatarSize(size: number | undefined, extraSmall: boolean): AvatarSize {
  if (extraSmall) return "xs";
  if (size === undefined) return "md";
  if (size <= 20) return "2xs";
  if (size <= 34) return "sm";
  return "md";
}

const avatarImageStyle = css({ w: "full", h: "full", objectFit: "cover", borderRadius: "pill" });

export function Avatar({
  name,
  src,
  size,
  extraSmall = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  extraSmall?: boolean;
}) {
  const step = avatarSize(size, extraSmall);
  const pixels = AVATAR_PIXELS[step];
  return (
    <span className={avatarRecipe({ size: step })} aria-hidden="true">
      {src ? (
        <Image
          alt=""
          src={src}
          width={pixels}
          height={pixels}
          sizes={`${pixels}px`}
          className={avatarImageStyle}
        />
      ) : (
        initials(name)
      )}
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
  letterSpacing: "0.08em",
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
      green: { bg: "primary.100", color: "primary.800" },
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
