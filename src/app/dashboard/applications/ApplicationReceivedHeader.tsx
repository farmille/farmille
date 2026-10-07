import Link from "next/link";

import { buttonRecipe } from "@/components";

import { css } from "../../../../styled-system/css";

const wrap = css({
  textAlign: "center",
  pt: "7.5",
  px: "3",
  pb: "2.5",
  _print: { display: "none" },
});

const checkMark = css({
  w: "20",
  h: "20",
  borderRadius: "pill",
  bg: "primary.100",
  color: "primary.700",
  display: "grid",
  placeItems: "center",
  mx: "auto",
  mb: "4.5",
});

const kindTitle = css({ fontSize: "md", color: "text.muted", mt: "2", lineHeight: "prose" });

const actions = css({ mt: "4.5", display: "flex", flexDirection: "column", gap: "2.5" });

export function ApplicationReceivedHeader({ title }: { title: string | null }) {
  return (
    <div className={wrap}>
      <div className={checkMark} aria-hidden="true">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        >
          <path d="M5 12l5 5 9-11" />
        </svg>
      </div>
      <h1 className={css({ fontSize: "2xl" })}>ご申請を受け付けました</h1>
      {title === null ? null : <p className={kindTitle}>{title}</p>}
      <div className={actions}>
        <Link className={buttonRecipe({ variant: "ghost" })} href="/dashboard/applications">
          各種お手続きへ戻る
        </Link>
      </div>
    </div>
  );
}
