import Link from "next/link";

import { css } from "../../../styled-system/css";

type SiteBackBarProps = {
  title: string;
  /** 戻る先。ブラウザ履歴に頼らず、画面ごとに決めた親画面へ戻す。 */
  backHref: string;
  /** 共有アイコン。共有先がある画面だけ渡す。 */
  shareHref?: string;
};

const bar = css({
  bg: "surface.panel/88",
  backdropFilter: "blur(10px)",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  px: "3.5",
  pt: "3",
  pb: "3",
  tab: { minH: "14", px: "8", pt: "3.5" },
});

const iconLink = css({
  w: "8",
  h: "8",
  display: "grid",
  placeItems: "center",
  color: "text.muted",
  borderRadius: "input",
});

const titleText = css({
  flex: "1",
  minW: "0",
  fontSize: "lg",
  fontWeight: "bold",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

/** 戻る・画面名・（共有）の帯。 */
export function SiteBackBar({ title, backHref, shareHref }: SiteBackBarProps) {
  return (
    <div className={bar}>
      <Link href={backHref} className={iconLink} aria-label="戻る">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </Link>
      <div className={titleText}>{title}</div>
      {shareHref ? (
        <Link href={shareHref} className={iconLink} aria-label="共有">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M4 12v8a1 1 0 001 1h14a1 1 0 001-1v-8M16 6l-4-4-4 4M12 2v14" />
          </svg>
        </Link>
      ) : null}
    </div>
  );
}
