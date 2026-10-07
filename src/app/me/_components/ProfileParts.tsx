import Link from "next/link";
import type { ReactNode } from "react";

import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { css } from "../../../../styled-system/css";

const headingRow = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "2.5",
  mt: "6",
  mb: "3",
  tab: { mt: "14", mb: "5" },
});

const headingText = css({
  fontSize: "lg",
  tab: { fontSize: "3xl", letterSpacing: "0.01em" },
});

const headingCount = css({
  color: "text.subtle",
  fontSize: "sm",
  fontVariantNumeric: "tabular-nums",
});

export const moreLinkStyle = css({
  color: "primary.700",
  fontSize: "sm",
  textDecoration: "none",
  whiteSpace: "nowrap",
});

/** プロフィール画面の区切り見出し。件数と一覧へのリンクを右に添えられる。 */
export function ProfileSectionHeading({
  id,
  children,
  count,
  more,
}: {
  id: string;
  children: ReactNode;
  count?: string;
  more?: { href: string; label: string };
}) {
  return (
    <div className={headingRow}>
      <h2 className={headingText} id={id}>
        {children}
        {count === undefined ? null : <span className={headingCount}> {count}</span>}
      </h2>
      {more === undefined ? null : (
        <Link className={moreLinkStyle} href={more.href}>
          {more.label}
        </Link>
      )}
    </div>
  );
}

const emptyNote = css(surfaceCardRecipe.raw(), {
  color: "text.subtle",
  fontSize: "sm",
  textAlign: "center",
  "& b": { display: "block", mb: "1", color: "text.muted", fontSize: "sm" },
});

/** 一覧が空のときの案内。 */
export function EmptyNote({ title, description }: { title: string; description: string }) {
  return (
    <div className={emptyNote}>
      <b>{title}</b>
      {description}
    </div>
  );
}

/** 投稿カードを縦に積む。 */
export const postStackStyle = css({ display: "flex", flexDirection: "column", gap: "3" });
