import Image from "next/image";
import { css } from "../../styled-system/css";

/** 下端を次のセクションに重ね、角丸の背後にもその背景を見せる。 */
export function PreparationNotice() {
  return (
    <aside
      id="preparation-notice"
      aria-label="公開準備中のお知らせ"
      className={css({
        position: "relative",
        zIndex: "2",
        mb: "-4",
        bg: "brand.primaryDeep",
        color: "surface.card",
        borderBottomRadius: "banner",
        boxShadow: "overlay",
        px: "4",
        py: "3",
      })}
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
            Farmilleは現在準備中です。メーカー様のご登録および一般の会員登録は、現在受け付けておりません。
          </p>
          <p className={css({ m: "0" })}>
            メーカー様からの掲載・編集のご希望、掲載内容の修正・非表示のご依頼、アカウント登録は、9月24日〜28日に{" "}
            <a
              href="mailto:info@farmille.com"
              className={css({ color: "inherit", textDecoration: "underline" })}
            >
              info@farmille.com
            </a>{" "}
            またはお問い合わせフォーム（準備中）にて承ります。いただいたご連絡には順次対応いたしますので、お返事までお時間をいただく場合がございます。
          </p>
          <p className={css({ m: "0" })}>
            生産者の皆様への公開（感想口コミ・実証詳細レポートの投稿）は、10月1日以降を予定しております。
          </p>
        </div>
      </div>
    </aside>
  );
}
