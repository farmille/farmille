import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";

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

// 2026-06-10 根本さん指示: メーカーのロゴ（公式サイト由来の画像）は出さず、社名
// ベースで整って見えるテキスト主体のカードにする。以前は社名の先頭1文字を大きな
// タイルに表示していたが「（雪」のような崩れた見た目になるため撤去した。
export function ManufacturerCard({
  manufacturer,
}: {
  manufacturer: Manufacturer;
}) {
  const location = formatLocation(manufacturer.prefecture, manufacturer.city);

  return (
    <Link
      href={`/manufacturers/${manufacturer.id}`}
      data-testid="manufacturer-card"
      className="group flex h-full flex-col gap-4 border border-border bg-card p-6"
      style={{
        borderRadius: "var(--radius-lg)",
        transition: "var(--transition-fast)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* ロゴの代わりに控えめなブランドアイコンを置き、社名を主役にする */}
      <span
        className="inline-flex h-11 w-11 items-center justify-center"
        style={{
          backgroundColor: "var(--green-subtle)",
          color: "var(--green-dark)",
          borderRadius: "var(--radius-md)",
        }}
        aria-hidden="true"
      >
        <Building2 className="h-5 w-5" />
      </span>

      <h3
        className="text-lg font-bold text-foreground group-hover:text-[var(--green-primary)] line-clamp-2"
        style={{ transition: "var(--transition-fast)" }}
      >
        {manufacturer.company_name}
      </h3>

      {location && (
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
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
    </Link>
  );
}
