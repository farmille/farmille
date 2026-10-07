import Link from "next/link";
import type { ReactNode } from "react";

import { buttonRecipe } from "@/components/Button";
import { surfaceCardRecipe } from "@/components/SurfaceCard";

import { css } from "../../../../styled-system/css";

const row = css(surfaceCardRecipe.raw({ padding: "flush" }), {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: "3.5",
  py: "3.5",
  px: "4",
  tab: { flexDirection: "row", alignItems: "center" },
});

const main = css({ flex: "1", minW: "0" });

const title = css({ fontSize: "md" });

const description = css({
  fontSize: "sm",
  color: "text.muted",
  mt: "1",
  lineHeight: "prose",
});

const action = css(buttonRecipe.raw({ variant: "ghost" }), {
  w: "auto",
  minW: "auto",
  py: "2",
  px: "3.5",
  fontSize: "sm",
  lineHeight: "normal",
  flex: "none",
  whiteSpace: "nowrap",
});

export function ProcedureRow({
  heading: Heading,
  title: titleText,
  href,
  actionLabel,
  children,
}: {
  heading: "h2" | "h3";
  title: string;
  href: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <div className={row}>
      <div className={main}>
        <Heading className={title}>{titleText}</Heading>
        <p className={description}>{children}</p>
      </div>
      <Link className={action} href={href}>
        {actionLabel}
      </Link>
    </div>
  );
}
