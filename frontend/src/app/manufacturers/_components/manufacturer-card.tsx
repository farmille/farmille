import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

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

// design-tokens v2 + AgList-inspired manufacturer card. Logo placeholder uses
// a green-subtle tile with the first character; once we have a logo column,
// swap the placeholder with <Image>.
export function ManufacturerCard({
  manufacturer,
}: {
  manufacturer: Manufacturer;
}) {
  const location = formatLocation(manufacturer.prefecture, manufacturer.city);
  const initial = manufacturer.company_name.trim().slice(0, 1) || "?";

  return (
    <Link
      href={`/manufacturers/${manufacturer.id}`}
      data-testid="manufacturer-card"
      className="group flex h-full flex-col overflow-hidden border border-border bg-card"
      style={{
        borderRadius: "var(--radius-lg)",
        transition: "var(--transition-fast)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Logo placeholder tile — aspect-[4/3] to align with ProductCard grid rhythm
          while leaving room for long company names below the tile. */}
      <div
        className="flex aspect-[4/3] items-center justify-center"
        style={{ backgroundColor: "var(--green-subtle)" }}
      >
        <span
          className="inline-flex h-20 w-20 items-center justify-center text-3xl font-extrabold"
          style={{
            backgroundColor: "var(--overlay-on-light-strong)",
            color: "var(--green-dark)",
            borderRadius: "var(--radius-full)",
            letterSpacing: "-0.02em",
          }}
          aria-hidden="true"
        >
          {initial}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3
          className="text-lg font-bold text-foreground group-hover:text-[var(--green-primary)] line-clamp-2"
          style={{ transition: "var(--transition-fast)" }}
        >
          {manufacturer.company_name}
        </h3>

        {location && (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            {location}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span
            className="inline-flex items-center px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: "var(--green-subtle)",
              color: "var(--green-dark)",
              borderRadius: "var(--radius-full)",
            }}
          >
            資材 {manufacturer.product_count} 件
          </span>

          <span
            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--green-primary)] group-hover:text-[var(--green-dark)]"
            style={{ transition: "var(--transition-fast)" }}
          >
            詳しく
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
