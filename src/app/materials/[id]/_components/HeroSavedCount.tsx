import type { ReactNode } from "react";

import { getMaterialSavedCount } from "@/server/queries/catalog-search";

import { cva } from "../../../../../styled-system/css";

const countRecipe = cva({
  base: { fontWeight: "bold", fontVariantNumeric: "tabular-nums" },
  variants: {
    tone: {
      plain: {},
      zero: { color: "text.default" },
      highlight: { color: "accent.warn", fontSize: "md" },
    },
  },
  defaultVariants: { tone: "plain" },
});

export function HeroCount({
  tone,
  children,
}: {
  tone?: "plain" | "zero" | "highlight";
  children: ReactNode;
}) {
  return <b className={countRecipe({ tone })}>{children}</b>;
}

export async function HeroSavedCount({ materialId }: { materialId: string }) {
  const count = await getMaterialSavedCount(materialId);
  return <HeroCount>{count ?? "−"}</HeroCount>;
}
