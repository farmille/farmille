import Image from "next/image";
import { css, cva } from "../../styled-system/css";

const noticeStyle = cva({
  base: {
    position: "relative",
    zIndex: "2",
    bg: "primary.700",
    color: "surface.card",
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

/**
 * 完成見本の画面（.fm の中）で使う見た目。文言は既定の見た目と共通。
 * スタイルは src/app/_mock/chrome.css の .prep-notice。
 */
function MockPreparationNotice() {
  return (
    <aside id="preparation-notice" aria-label="公開準備中のお知らせ" className="prep-notice">
      <div className="prep-notice-inner">
        <p className="prep-notice-h">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M0.833333 17.5L10 1.66667L19.1667 17.5H0.833333ZM10 15C10.4602 15 10.8333 14.6269 10.8333 14.1667C10.8333 13.7064 10.4602 13.3333 10 13.3333C9.53976 13.3333 9.16667 13.7064 9.16667 14.1667C9.16667 14.6269 9.53976 15 10 15ZM9.16667 12.5H10.8333V8.33333H9.16667V12.5Z" />
          </svg>
          {NOTICE_TITLE}
        </p>
        <div className="prep-notice-body">
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
  /** "mock" は完成見本の画面（.fm の中）用。見本にない画面は既定のまま。 */
  look?: "default" | "mock";
}) {
  if (look === "mock") {
    return <MockPreparationNotice />;
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
