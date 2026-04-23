import Link from "next/link";

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

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block rounded-md border border-border bg-card overflow-hidden hover:shadow-sm transition-shadow"
    >
      <div className="aspect-[4/3] bg-muted flex items-center justify-center text-muted-foreground text-sm">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>No Image</span>
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
        <p className="text-sm text-muted-foreground line-clamp-1">
          {product.maker_name ?? "メーカー不明"}
        </p>
      </div>
    </Link>
  );
}
