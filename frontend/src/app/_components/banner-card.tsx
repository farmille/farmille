import Image from "next/image";
import Link from "next/link";

// Phase 18: ホームバナー（自社記事 / キャンペーン告知）
// spec docs/specs/home.md §6.3 / §6.4
//
// 商用広告 / アフィリエイトは v1 アウト（spec §13）。本コンポーネントは
// 運営手動投入バナーの表示のみを担う。link_url が外部 URL の場合のみ
// target="_blank" + rel="noopener" を付与する。

export type Banner = {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  sort_order: number;
};

function isExternalUrl(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function BannerCard({ banner }: { banner: Banner }) {
  const external = isExternalUrl(banner.link_url);
  return (
    <Link
      href={banner.link_url}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group block w-72 shrink-0 snap-start rounded-md border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow"
    >
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        <Image
          src={banner.image_url}
          alt={banner.title}
          fill
          sizes="288px"
          className="object-cover"
        />
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground group-hover:text-primary line-clamp-2">
          {banner.title}
        </h3>
      </div>
    </Link>
  );
}
