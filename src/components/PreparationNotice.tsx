import Image from "next/image";
import { css, cva } from "../../styled-system/css";

const noticeStyle = cva({
  base: {
    position: "relative",
    zIndex: "2",
    bg: "primary.700",
    color: "text.inverse",
    borderBottomRadius: "banner",
    boxShadow: "overlay",
    px: "4",
    py: "3",
  },
  variants: {
    overlapImage: { true: { mb: "-4" }, false: {} },
    roundedTop: { true: { borderTopRadius: "banner" }, false: {} },
  },
});

const NOTICE_TITLE = "Farmilleは現在準備中です";
const NOTICE_LINES = [
  "Farmilleは現在準備中です。",
  "ユーザー様・企業様ともに、会員登録は受け付けておりません。",
  "なお、企業様からの、資材ページ削除のご依頼・間違いのご指摘については順次対応いたします。",
] as const;

const siteNotice = css({
  bg: "accent.warnSoft",
  color: "text.muted",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
});

const siteNoticeInner = css({
  maxW: "content.wide",
  mx: "auto",
  px: "4",
  pt: "3",
  pb: "3",
  tab: { px: "8", pt: "3.5", pb: "4" },
});

const siteNoticeTitle = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  color: "accent.warn",
  fontSize: "md",
  fontWeight: "extrabold",
  lineHeight: "normal",
  "& svg": { flex: "0 0 auto", display: "block" },
});

const siteNoticeBody = css({
  mt: "1",
  fontSize: "sm",
  lineHeight: "prose",
  "& p + p": { mt: "0.5" },
});

/** SitePageShell の画面で使う見た目。文言は既定の見た目と共通。 */
function SitePreparationNotice() {
  return (
    <aside id="preparation-notice" aria-label="公開準備中のお知らせ" className={siteNotice}>
      <div className={siteNoticeInner}>
        <p className={siteNoticeTitle}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M0.833333 17.5L10 1.66667L19.1667 17.5H0.833333ZM10 15C10.4602 15 10.8333 14.6269 10.8333 14.1667C10.8333 13.7064 10.4602 13.3333 10 13.3333C9.53976 13.3333 9.16667 13.7064 9.16667 14.1667C9.16667 14.6269 9.53976 15 10 15ZM9.16667 12.5H10.8333V8.33333H9.16667V12.5Z" />
          </svg>
          {NOTICE_TITLE}
        </p>
        <div className={siteNoticeBody}>
          {NOTICE_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </aside>
  );
}

/** 下端を次のセクションに重ね、角丸の背後にもその背景を見せる。 */
export function PreparationNotice({
  overlapImage = false,
  roundedTop = false,
  look = "default",
}: {
  overlapImage?: boolean;
  roundedTop?: boolean;
  /** "site" は SitePageShell の画面用。 */
  look?: "default" | "site";
}) {
  if (look === "site") {
    return <SitePreparationNotice />;
  }

  return (
    <aside
      id="preparation-notice"
      aria-label="公開準備中のお知らせ"
      className={noticeStyle({ overlapImage, roundedTop })}
    >
      <div className={css({ maxW: "content.wide", mx: "auto" })}>
        <p
          className={css({
            m: "0",
            display: "flex",
            alignItems: "center",
            gap: "2",
            fontSize: "lg",
            lineHeight: "relaxed",
            fontWeight: "semibold",
          })}
        >
          <Image
            src="/icons/notice-warning.svg"
            alt=""
            width={20}
            height={20}
            className={css({ flexShrink: "0" })}
          />
          {NOTICE_TITLE}
        </p>
        <div
          className={css({
            pt: "3",
            fontSize: "md",
            lineHeight: "relaxed",
            display: "flex",
            flexDirection: "column",
            gap: "2",
          })}
        >
          {NOTICE_LINES.map((line) => (
            <p key={line} className={css({ m: "0" })}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </aside>
  );
}
