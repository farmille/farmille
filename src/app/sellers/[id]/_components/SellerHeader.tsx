import { ExternalIcon } from "@/app/materials/[id]/_components/CardParts";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { Badge } from "@/components/Badge";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import type { PublicSellerPageData } from "@/server/queries/public-sellers";

import { css, cx } from "../../../../../styled-system/css";

const linkRowStyle = css({ display: "inline-flex", alignItems: "center", gap: "1" });

function checkedExternalUrl(value: string): string {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("メーカーの公式サイトURLはHTTPまたはHTTPSで指定してください。");
  }

  return url.toString();
}

function PinIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

type SellerHeaderProps = {
  seller: PublicSellerPageData["seller"];
};

export function SellerHeader({ seller }: SellerHeaderProps) {
  const websiteUrl = seller.websiteUrl === null ? null : checkedExternalUrl(seller.websiteUrl);

  return (
    <section
      className={cx(surfaceCardRecipe(), css({ display: "flex", gap: "3" }))}
      aria-labelledby="seller-name"
    >
      <div
        className={css({
          display: "grid",
          placeItems: "center",
          flexShrink: "0",
          w: "14",
          h: "14",
          overflow: "hidden",
          borderRadius: "media",
          bg: "primary.100",
          color: "primary.800",
          fontSize: "xl",
          fontWeight: "extrabold",
          "& img": { w: "full", h: "full", objectFit: "cover" },
        })}
      >
        {seller.logoUrl ? (
          <Image alt="" height={56} sizes="56px" src={seller.logoUrl} width={56} />
        ) : (
          seller.officialName.charAt(0)
        )}
      </div>
      <div className={css({ flex: "1", minW: "0" })}>
        <h1 id="seller-name" className={css({ fontSize: "lg" })}>
          {seller.officialName}
        </h1>
        <Badge className={css({ mt: "1" })}>メーカー</Badge>
        {seller.profileText ? (
          <p
            className={css({ mt: "2", fontSize: "sm", lineHeight: "relaxed", color: "text.muted" })}
          >
            {seller.profileText}
          </p>
        ) : null}
        {websiteUrl !== null || seller.regionScope !== null ? (
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "1.5",
              mt: "2",
              fontSize: "sm",
            })}
          >
            {websiteUrl === null ? null : (
              <a
                className={cx(linkRowStyle, css({ color: "primary.700", textDecoration: "none" }))}
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalIcon /> {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <span className={css({ srOnly: true })}>（公式サイト・別タブで開きます）</span>
              </a>
            )}
            {seller.regionScope === null ? null : (
              <span className={cx(linkRowStyle, css({ color: "text.muted" }))}>
                <PinIcon /> {seller.regionScope}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
