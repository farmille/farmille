import Link from "next/link";
import Image from "next/image";

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

export function ProductCard({ product, hideMakerName = false }: ProductCardProps) {
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No Image
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        {product.type_name && (
          <span className="inline-block rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {product.type_name}
          </span>
        )}
        <h3 className="text-base font-semibold text-foreground group-hover:text-primary line-clamp-2">
          {product.name}
        </h3>
        {!hideMakerName && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {product.maker_name ?? "メーカー不明"}
          </p>
        )}
      </div>
    </Link>
  );
}
