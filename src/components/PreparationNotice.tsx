"use client";

import Image from "next/image";
import { useState } from "react";
import { css } from "../../styled-system/css";

/** 詳細は必要なときに開き、閉じたお知らせはページを開き直すと再表示する。 */
export function PreparationNotice() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <aside
      id="preparation-notice"
      aria-label="公開準備中のお知らせ"
      className={css({
        bg: "brand.primaryDeep",
        color: "surface.card",
        borderBottomRadius: "banner",
        boxShadow: "overlay",
        pl: "4",
        pr: "3",
        py: "2.5",
      })}
    >
      <div
        className={css({
          maxW: "content.wide",
          mx: "auto",
          display: "flex",
          gap: "3",
          alignItems: "flex-start",
        })}
      >
        <details className={css({ flex: "1", minW: "0" })}>
          <summary
            className={css({
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              columnGap: "3",
              rowGap: "1",
              cursor: "pointer",
              listStyle: "none",
              fontSize: "lg",
              lineHeight: "relaxed",
              "&::-webkit-details-marker": { display: "none" },
            })}
          >
            <span
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "2",
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
            </span>
            <span className={css({ textDecoration: "underline", textUnderlineOffset: "auto" })}>
              詳細はこちら
            </span>
          </summary>
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
        </details>
        <button
          type="button"
          aria-label="お知らせを閉じる"
          onClick={() => setDismissed(true)}
          className={css({
            position: "relative",
            flexShrink: "0",
            mt: "1",
            cursor: "pointer",
            color: "inherit",
            bg: "transparent",
            border: "none",
            p: "0",
            _before: { content: '""', position: "absolute", inset: "-3" },
          })}
        >
          <Image src="/icons/notice-close.svg" alt="" width={20} height={20} />
        </button>
      </div>
    </aside>
  );
}
