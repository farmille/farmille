import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css, cva, cx } from "../../../../../styled-system/css";

const wrapRecipe = cva({
  base: { display: "grid", gap: "1" },
  variants: {
    align: {
      start: {},
      center: { textAlign: "center" },
    },
  },
  defaultVariants: { align: "start" },
});

const titleStyle = css({ fontSize: "md", fontWeight: "bold" });
const descriptionStyle = css({ fontSize: "sm", color: "text.subtle" });

/** 投稿がまだ無い欄に出すカード。 */
export function EmptyCard({
  title,
  description,
  align,
  className,
}: {
  title: string;
  description: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div className={cx(surfaceCardRecipe(), wrapRecipe({ align }), className)}>
      <p className={titleStyle}>{title}</p>
      <p className={descriptionStyle}>{description}</p>
    </div>
  );
}
