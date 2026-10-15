import { Icon } from "@/components/Icon";
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

/** 下端を次のセクションに重ね、角丸の背後にもその背景を見せる。 */
export function PreparationNotice({
  overlapImage = false,
  roundedTop = false,
}: {
  overlapImage?: boolean;
  roundedTop?: boolean;
}) {
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
            textStyle: "title",
            fontWeight: "semibold",
          })}
        >
          <Icon name="warning" size="md" />
          Farmilleは現在準備中です
        </p>
        <div
          className={css({
            pt: "3",
            textStyle: "body",
            display: "flex",
            flexDirection: "column",
            gap: "1",
            // tab 以上は文を横に並べる。3文が収まる幅なら一行になり、収まらなければ折り返す。
            tab: { flexDirection: "row", flexWrap: "wrap", columnGap: "3" },
          })}
        >
          <p className={css({ m: "0" })}>Farmilleは現在準備中です。</p>
          <p className={css({ m: "0" })}>
            ユーザー様・企業様ともに、会員登録は受け付けておりません。
          </p>
          <p className={css({ m: "0" })}>
            なお、企業様からの、資材ページ削除のご依頼・間違いのご指摘については順次対応いたします。
          </p>
        </div>
      </div>
    </aside>
  );
}
