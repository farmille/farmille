import Link from "next/link";
import Image from "next/image";
import { PRODUCT_IMAGES_ENABLED } from "@/lib/flags";
import { ArrowRight } from "lucide-react";

export type Product = {
  id: string;
  name: string;
  maker_id: string | null;
  maker_name: string | null;
  type_id: string | null;
  type_name: string | null;
  image_url: string | null;
  created_at: string | null;
};

export type ProductCardProps = {
  product: Product;
  /**
   * メーカー詳細ページのように、親セクションでメーカー名を出す場面で
   * カードごとの再表示を避けるためのフラグ。Phase 17 spec §6.2 参照。
   */
  hideMakerName?: boolean;
};

// design-tokens v2 + AgList-inspired ag biologicals catalog card. Square image,
// pill tags, primary CTA at the bottom. Cards live on a softer page background
// so the white-ish card surface stands out.
export function ProductCard({ product, hideMakerName = false }: ProductCardProps) {
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
      <div className="relative aspect-square bg-[var(--green-subtle)] overflow-hidden">
        {PRODUCT_IMAGES_ENABLED && product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--green-glow)",
                color: "var(--green-dark)",
              }}
            >
              画像準備中
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        {product.type_name && (
          <div className="flex flex-wrap gap-1.5">
            <span
              className="inline-flex items-center px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "var(--green-subtle)",
                color: "var(--green-dark)",
                borderRadius: "var(--radius-full)",
              }}
            >
              {product.type_name}
            </span>
          </div>
        )}

        <h3
          className="text-base font-bold leading-snug text-foreground line-clamp-2 group-hover:text-[var(--green-primary)]"
          style={{ transition: "var(--transition-fast)" }}
        >
          {product.name}
        </h3>

        {!hideMakerName && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {product.maker_name ?? "メーカー不明"}
          </p>
        )}

        <div className="mt-auto pt-2">
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--green-primary)] group-hover:text-[var(--green-dark)]"
            style={{ transition: "var(--transition-fast)" }}
          >
            詳細を見る
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
