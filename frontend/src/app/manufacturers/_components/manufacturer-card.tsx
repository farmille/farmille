import Link from "next/link";

export type Manufacturer = {
  id: string;
  company_name: string;
  prefecture: string | null;
  city: string | null;
  product_count: number;
};

function formatLocation(prefecture: string | null, city: string | null): string {
  return [prefecture, city].filter(Boolean).join(" ").trim();
}

export function ManufacturerCard({ manufacturer }: { manufacturer: Manufacturer }) {
  const location = formatLocation(manufacturer.prefecture, manufacturer.city);
  return (
    <Link
      href={`/manufacturers/${manufacturer.id}`}
      data-testid="manufacturer-card"
      className="group block border border-border bg-card p-6 hover:bg-[var(--card-hover,_#f0f2f5)] hover:shadow-[var(--shadow-sm)]"
      style={{
        borderRadius: "var(--radius-lg)",
        transition: "var(--transition-fast)",
      }}
    >
      <div className="space-y-3">
        <h3 className="text-xl font-bold text-foreground group-hover:text-[var(--green-primary)] line-clamp-2">
          {manufacturer.company_name}
        </h3>
        {location ? (
          <p className="text-sm text-muted-foreground">{location}</p>
        ) : null}
        <p
          className="inline-flex items-center px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: "var(--green-subtle)",
            color: "var(--green-dark)",
            borderRadius: "var(--radius-full)",
          }}
        >
          資材 {manufacturer.product_count} 件
        </p>
      </div>
    </Link>
  );
}
