import Link from "next/link";
import Image from "next/image";
import { PRODUCT_IMAGES_ENABLED } from "@/lib/flags";

// Phase 18: 注目の資材セクション
// spec docs/specs/home.md §6.1 / §6.4
//
// 既存 ProductCard の依存を持ち込まず、ホーム用に最小カード（タグ + 画像 + 名前）
// を本コンポーネント内に閉じる。横スクロールカードで素朴に並べる
// （アイハーブ風の最終形は §5.2.14 確定後の v1.5+、spec §13）。

export type FeaturedProductInner = {
  id: string;
  name: string;
  maker_name: string | null;
  image_url: string | null;
  type_name: string | null;
};

export type FeaturedProduct = {
  id: string; // featured_products.id
  sort_order: number;
  product: FeaturedProductInner;
};

function FeaturedProductCard({ product }: { product: FeaturedProductInner }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block w-60 shrink-0 snap-start rounded-md border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {PRODUCT_IMAGES_ENABLED && product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="240px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            画像準備中
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        {product.type_name ? (
          <span className="inline-block rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {product.type_name}
          </span>
        ) : null}
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {product.maker_name ?? "製造元不明"}
        </p>
      </div>
    </Link>
  );
}

export function FeaturedProductsSection({
  items,
}: {
  items: FeaturedProduct[];
}) {
  // 0 件時は UI 崩れない（spec §1.1, §9.2）→ セクション自体を出さない
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="featured-products-heading" className="space-y-4">
      <div className="flex items-end justify-between">
        <h2
          id="featured-products-heading"
          className="text-2xl font-semibold text-foreground"
        >
          注目の資材
        </h2>
        <Link
          href="/products"
          className="text-sm text-primary hover:underline"
        >
          すべて見る
        </Link>
      </div>
      <div className="overflow-x-auto snap-x snap-mandatory -mx-6 px-6">
        <div className="flex gap-4 pb-2">
          {items.map((item) => (
            <FeaturedProductCard key={item.id} product={item.product} />
          ))}
        </div>
      </div>
    </section>
  );
}
