import Image from "next/image";
import { css, cva } from "../../styled-system/css";

const noticeStyle = cva({
  base: {
    position: "relative",
    zIndex: "2",
    bg: "brand.primaryDeep",
    color: "surface.card",
    borderBottomRadius: "banner",
    boxShadow: "overlay",
    px: "4",
    py: "3",
  },
  variants: { overlapImage: { true: { mb: "-4" }, false: {} } },
});

/** 下端を次のセクションに重ね、角丸の背後にもその背景を見せる。 */
export function PreparationNotice({ overlapImage = false }: { overlapImage?: boolean }) {
  return (
    <aside
      id="preparation-notice"
      aria-label="公開準備中のお知らせ"
      className={noticeStyle({ overlapImage })}
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
          Farmilleは現在準備中です
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
          <p className={css({ m: "0" })}>
            Farmilleは現在、準備中です。
            <br />
            メーカー様のご登録および一般会員のご登録は、現在受け付けておりません。
          </p>
          <p className={css({ m: "0" })}>
            メーカー様からのお問い合わせや、資材ページの非公開に関するご依頼は、
            <br />
            まずは9月24日〜28日を目安に、
            <a
              href="mailto:contact@farmille.com"
              className={css({ color: "inherit", textDecoration: "underline" })}
            >
              contact@farmille.com
            </a>
            までご連絡ください。
          </p>
          <p className={css({ m: "0" })}>
            いただいたご連絡は、内容を確認のうえ、順次対応いたします。
            <br />
            大変申し訳ありませんが、返信までにお時間をいただく場合があります。
          </p>
          <p className={css({ m: "0" })}>
            生産者の皆様への公開および口コミ・実証詳細レポートの投稿受付は、
            <br />
            10月1日以降を予定しております。
          </p>
        </div>
      </div>
    </aside>
  );
}
