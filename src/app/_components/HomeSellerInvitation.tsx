import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { css } from "../../../styled-system/css";
import { Reveal } from "./Reveal";

/** 下にはフッターの丘が重なるので、丘の高さ（10・16・24）に余白を足した分だけ空ける。 */
const section = css({
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  pb: "24",
  tab: { px: "8", pb: "32" },
  pc: { pb: "40" },
});

const card = css({
  display: "flex",
  flexDirection: "column",
  gap: "6",
  p: "6",
  bg: "surface.card",
  borderRadius: "banner",
  boxShadow: "shadow",
  tab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10",
    p: "10",
  },
});

const label = css({
  m: "0",
  mb: "2",
  color: "text.brand",
  textStyle: "eyebrow",
  textTransform: "uppercase",
});

const title = css({ m: "0", textStyle: "title" });

const copy = css({
  m: "0",
  mt: "3",
  maxW: "content.reading",
  textStyle: "supporting",
  color: "text.muted",
});

const action = css(buttonRecipe.raw({ size: "md" }), {
  gap: "2",
  borderRadius: "pill",
  flexShrink: "0",
  transitionProperty: "transform",
  transitionDuration: "fast",
  transitionTimingFunction: "out",
  _active: { transform: "scale(0.97)" },
  "@media (hover: hover) and (pointer: fine)": { _hover: { bg: "primary.800" } },
  tab: { w: "auto" },
});

/** 資材メーカーへの案内。ホームの最後、フッターの手前に置く。 */
export function HomeSellerInvitation() {
  return (
    <section aria-labelledby="seller-invitation-title" className={section}>
      <Reveal>
        <div className={card}>
          <div>
            <p className={label}>For makers</p>
            <h2 className={title} id="seller-invitation-title">
              バイオスティミュラント・関連資材メーカー様へ
            </h2>
            <p className={copy}>
              資材ページの編集権を確認後、製品情報をメーカーご自身で更新できます。下書きとプレビューを用意し、公開前に運営が表現を確認します。生産者が資材を比較するために、詳細な情報を掲載してください。
            </p>
          </div>
          <Link className={action} href="/sellers">
            メーカー様はこちら
            <Icon name="arrow_forward" size="sm" />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
