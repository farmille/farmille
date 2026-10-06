import type { ReactNode } from "react";

import { cva, css, cx, type RecipeVariantProps } from "../../styled-system/css";

const surfaceCardRecipe = cva({
  base: {
    bg: "surface.card",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border.default",
    borderRadius: "card",
    boxShadow: "shadow",
  },
  variants: {
    tone: {
      standard: {},
      soft: {
        bg: "primary.soft",
      },
    },
    padding: {
      standard: { p: "4" },
      cozy: { p: "3.5" },
      compact: { p: "3" },
      snug: { p: "2.5" },
      flush: { p: "0" },
    },
  },
  defaultVariants: {
    tone: "standard",
    padding: "standard",
  },
});

export type SurfaceCardVariants = RecipeVariantProps<typeof surfaceCardRecipe>;

type SurfaceCardProps = SurfaceCardVariants & {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

/** 見出しを持てる共通カード。画面固有のカード装飾を増やさないために使う。 */
export function SurfaceCard({
  title,
  description,
  tone,
  padding,
  children,
  className,
}: SurfaceCardProps) {
  return (
    <section aria-label={title} className={cx(surfaceCardRecipe({ tone, padding }), className)}>
      {title === undefined ? null : (
        <h2
          className={css({
            m: "0",
            color: "text.default",
            fontSize: "lg",
            lineHeight: "snug",
          })}
        >
          {title}
        </h2>
      )}
      {description === undefined ? null : (
        <p
          className={css({
            mt: title === undefined ? "0" : "1.5",
            mb: "0",
            color: "text.muted",
            fontSize: "sm",
            lineHeight: "relaxed",
          })}
        >
          {description}
        </p>
      )}
      <div className={css({ mt: title === undefined && description === undefined ? "0" : "4" })}>
        {children}
      </div>
    </section>
  );
}

export { surfaceCardRecipe };
