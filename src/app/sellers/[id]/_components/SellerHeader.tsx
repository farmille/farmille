import { MockExternalIcon } from "@/app/materials/[id]/_components/MockParts";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import type { PublicSellerPageData } from "@/server/queries/public-sellers";

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

/** 見本 S.seller の `.card.org-head`。名前の横の確認済みマークは表記ルールにより出さない。 */
export function SellerHeader({ seller }: SellerHeaderProps) {
  const websiteUrl = seller.websiteUrl === null ? null : checkedExternalUrl(seller.websiteUrl);

  return (
    <section className="card org-head" aria-labelledby="seller-name">
      <div className="org-logo">
        {seller.logoUrl ? (
          <Image alt="" height={56} sizes="56px" src={seller.logoUrl} width={56} />
        ) : (
          seller.officialName.charAt(0)
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="org-name">
          <h1 id="seller-name" style={{ fontSize: 17 }}>
            {seller.officialName}
          </h1>
        </div>
        <span className="type-label" style={{ marginTop: 5, display: "inline-block" }}>
          メーカー
        </span>
        {seller.profileText ? <p className="org-desc">{seller.profileText}</p> : null}
        {websiteUrl !== null || seller.regionScope !== null ? (
          <div className="org-links">
            {websiteUrl === null ? null : (
              <a href={websiteUrl} target="_blank" rel="noreferrer">
                <MockExternalIcon /> {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                <span className="sr-only">（公式サイト・別タブで開きます）</span>
              </a>
            )}
            {seller.regionScope === null ? null : (
              <span className="loc">
                <PinIcon /> {seller.regionScope}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
