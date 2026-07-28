import { OptimizedImage as Image } from "@/components/optimized-image";

import { OfficialCheckIcon } from "@/components/icons";
import type { PublicSellerPageData } from "@/server/queries/public-sellers";
import { css } from "../../../../../styled-system/css";

const SELLER_TYPE_LABELS: Readonly<Record<string, string>> = {
  maker: "メーカー",
  ja: "JA",
  farm_corp: "農業法人",
  expert: "専門家",
  other: "その他",
};

const card = css({
  display: "flex",
  gap: "3",
  p: "4",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
});

const logo = css({
  w: "14",
  h: "14",
  borderRadius: "button",
  bg: "brand.soft",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  overflow: "hidden",
  color: "brand.primaryDeep",
  fontSize: "xl",
  fontWeight: "800",
});

const typeLabel = css({
  display: "inline-flex",
  mt: "1",
  px: "2.5",
  py: "0.5",
  borderRadius: "pill",
  bg: "brand.soft",
  color: "brand.primaryDeep",
  fontSize: "xs",
  fontWeight: "700",
  whiteSpace: "nowrap",
});

const organizationLink = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  color: "brand.primary",
  textDecoration: "none",
});

function checkedExternalUrl(value: string): string {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("出品者の公式サイトURLはHTTPまたはHTTPSで指定してください。");
  }

  return url.toString();
}

export function sellerTypeLabel(value: string): string {
  const label = SELLER_TYPE_LABELS[value];

  if (label === undefined) {
    throw new Error(`未対応の出品者種別です：${value}`);
  }

  return label;
}

type SellerHeaderProps = {
  seller: PublicSellerPageData["seller"];
};

export function SellerHeader({ seller }: SellerHeaderProps) {
  const fallbackLogo = seller.sellerType === "ja" ? "JA" : seller.officialName.charAt(0);

  return (
    <section className={card} aria-labelledby="seller-name">
      <div className={logo}>
        {seller.logoUrl ? (
          <Image
            alt=""
            className={css({ w: "100%", h: "100%", objectFit: "cover" })}
            height={56}
            sizes="56px"
            src={seller.logoUrl}
            width={56}
          />
        ) : (
          fallbackLogo
        )}
      </div>
      <div className={css({ flex: "1", minW: "0" })}>
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "1.5",
            flexWrap: "wrap",
          })}
        >
          <h1 id="seller-name" className={css({ m: "0", fontSize: "xl", fontWeight: "800" })}>
            {seller.officialName}
          </h1>
          <OfficialCheckIcon size={16} className={css({ color: "accent.official" })} />
        </div>
        <span className={typeLabel}>{sellerTypeLabel(seller.sellerType)}</span>
        {seller.profileText ? (
          <p
            className={css({
              mt: "2",
              mb: "0",
              color: "text.muted",
              fontSize: "sm",
              lineHeight: "1.65",
            })}
          >
            {seller.profileText}
          </p>
        ) : null}
        <div
          className={css({
            display: "flex",
            flexDirection: "column",
            gap: "1.5",
            mt: "2.5",
            color: "text.muted",
            fontSize: "sm",
          })}
        >
          {seller.websiteUrl ? (
            <a
              href={checkedExternalUrl(seller.websiteUrl)}
              target="_blank"
              rel="noreferrer"
              className={organizationLink}
            >
              公式サイトを見る ↗
            </a>
          ) : null}
          <span>主な地域：{seller.regionScope}</span>
        </div>
      </div>
    </section>
  );
}
