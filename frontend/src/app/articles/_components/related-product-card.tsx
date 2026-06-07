import Link from "next/link";
import Image from "next/image";
import { PRODUCT_IMAGES_ENABLED } from "@/lib/flags";
import { ArrowRight, Sprout } from "lucide-react";

export type RelatedProduct = {
  id: string;
  name: string;
  maker_name: string | null;
  image_url: string | null;
  position: number;
};

/**
 * 記事詳細の「関連製品」セクション用カード。
 *
 * 既存 ProductCard を流用しなかった理由:
 * - related_products は type_name / created_at を持たない（spec §5.2）。
 *   ProductCard 型に null で詰めて流用するのは型のためだけのキャストになり、
 *   ProductCard 側の表示変更が articles に波及するため責務分離した方が安全。
 *
 * design-tokens v2 + AgList tone: ProductCard / ManufacturerCard / ArticleCard
 * と同じ card shell (radius-lg + shadow-sm + green-subtle image bg + pill chip
 * 「関連」+ ArrowRight CTA) を踏襲。spec §1.1 F7 / §5 DoD line 503。
 */
export function RelatedProductCard({ product }: { product: RelatedProduct }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex h-full flex-col overflow-hidden border border-border bg-card"
      style={{
        borderRadius: "var(--radius-lg)",
        transition: "var(--transition-fast)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="relative aspect-[4/3] bg-[var(--green-subtle)] overflow-hidden">
        {PRODUCT_IMAGES_ENABLED && product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="inline-flex items-center justify-center h-12 w-12"
              style={{
                backgroundColor: "var(--overlay-on-light-soft)",
                borderRadius: "var(--radius-full)",
              }}
            >
              <Sprout
                className="h-5 w-5 text-[var(--green-primary)]"
                aria-hidden="true"
              />
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span
          className="inline-flex w-fit items-center px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: "var(--green-subtle)",
            color: "var(--green-dark)",
            borderRadius: "var(--radius-full)",
          }}
        >
          関連
        </span>

        <h3
          className="text-sm font-bold leading-snug text-foreground line-clamp-2 group-hover:text-[var(--green-primary)]"
          style={{ transition: "var(--transition-fast)" }}
        >
          {product.name}
        </h3>

        <p className="text-xs text-muted-foreground line-clamp-1">
          {product.maker_name ?? "メーカー不明"}
        </p>

        <div className="mt-auto pt-2">
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--green-primary)] group-hover:text-[var(--green-dark)]"
            style={{ transition: "var(--transition-fast)" }}
          >
            詳細
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
