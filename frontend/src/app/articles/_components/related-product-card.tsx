import Link from "next/link";
import Image from "next/image";

export type RelatedProduct = {
  id: string;
  name: string;
  maker_name: string | null;
  image_url: string | null;
  position: number;
};

/**
 * 記事詳細の「関連製品」セクション用の軽量カード。
 *
 * 既存 ProductCard を流用しなかった理由:
 * - related_products は type_name / created_at を持たない（spec §5.2）。
 *   ProductCard 型に null で詰めて流用するのは型のためだけのキャストになり、
 *   ProductCard 側の表示変更が articles に波及するため責務分離した方が安全。
 * - 関連製品は補助 UI で、type バッジ等の追加情報は不要。
 */
export function RelatedProductCard({ product }: { product: RelatedProduct }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-md border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No Image
          </div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-primary line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {product.maker_name ?? "メーカー不明"}
        </p>
      </div>
    </Link>
  );
}
