import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  MapPin,
  Package,
  ChevronRight,
  Sprout,
} from "lucide-react";
import { ProductCard, type Product } from "@/app/products/_components/product-card";

type ManufacturerProduct = {
  id: string;
  name: string;
  type_name: string | null;
  image_url: string | null;
  created_at: string;
};

type ManufacturerDetail = {
  id: string;
  company_name: string;
  prefecture: string | null;
  city: string | null;
  note: string | null;
  products: ManufacturerProduct[];
};

type PageProps = {
  params: Promise<{ id: string }>;
};

async function fetchManufacturer(id: string): Promise<ManufacturerDetail | null> {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }
  const res = await fetch(`${apiUrl}/v1/manufacturers/${id}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to fetch manufacturer ${id}: ${res.status}`);
  }
  return (await res.json()) as ManufacturerDetail;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const m = await fetchManufacturer(id).catch(() => null);
  if (!m) {
    return { title: "製造元詳細" };
  }
  return {
    title: m.company_name,
    description:
      m.note?.slice(0, 120) ??
      `${m.company_name} の登録資材を Farmille で確認できます。`,
    openGraph: {
      title: `${m.company_name} | Farmille`,
      description:
        m.note?.slice(0, 120) ??
        `${m.company_name} の登録資材を Farmille で確認できます。`,
      url: `/manufacturers/${m.id}`,
    },
  };
}

function formatLocation(prefecture: string | null, city: string | null): string {
  return [prefecture, city].filter(Boolean).join(" ").trim();
}

export default async function ManufacturerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const manufacturer = await fetchManufacturer(id);
  if (!manufacturer) {
    notFound();
  }

  const location = formatLocation(manufacturer.prefecture, manufacturer.city);
  const initial = manufacturer.company_name.trim().slice(0, 1) || "?";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Breadcrumb bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-3 text-sm text-muted-foreground">
          <nav aria-label="パンくず" className="flex items-center gap-1.5">
            <Link
              href="/manufacturers"
              className="hover:text-[var(--green-primary)]"
            >
              製造元一覧
            </Link>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-foreground line-clamp-1">
              {manufacturer.company_name}
            </span>
          </nav>
        </div>
      </div>

      {/* Hero band — AgList /manufacturer/<slug> 風。<section> to avoid double <header>. */}
      <section
        aria-label="ページヘッダー"
        className="border-b border-border"
        style={{ backgroundColor: "var(--green-subtle)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-[auto_1fr] gap-6 md:gap-10 items-start">
          {/* Logo placeholder tile */}
          <div
            className="flex h-28 w-28 md:h-32 md:w-32 items-center justify-center"
            style={{
              backgroundColor: "var(--overlay-on-light-strong)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
            aria-hidden
          >
            <span
              className="text-5xl md:text-6xl font-extrabold"
              style={{
                color: "var(--green-dark)",
                letterSpacing: "-0.02em",
              }}
            >
              {initial}
            </span>
          </div>

          <div className="space-y-4">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: "var(--overlay-on-light-soft)",
                color: "var(--green-dark)",
                borderRadius: "var(--radius-full)",
              }}
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              製造元
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
              style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
            >
              {manufacturer.company_name}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              {location && (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {location}
                </span>
              )}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: "var(--green-primary)",
                  color: "var(--text-on-green)",
                  borderRadius: "var(--radius-full)",
                }}
              >
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                資材 {manufacturer.products.length} 件
              </span>
            </div>

            {manufacturer.note && (
              <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap max-w-3xl">
                {manufacturer.note}
              </p>
            )}
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-8">
        <section className="space-y-5">
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              登録資材
            </h2>
            <span className="text-sm text-muted-foreground">
              {manufacturer.products.length} 件
            </span>
          </div>

          {manufacturer.products.length === 0 ? (
            <div
              className="border border-border bg-card p-12 text-center space-y-3"
              style={{
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="flex justify-center">
                <span
                  className="inline-flex items-center justify-center h-14 w-14"
                  style={{
                    backgroundColor: "var(--green-subtle)",
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  <Sprout
                    className="h-7 w-7 text-[var(--green-primary)]"
                    aria-hidden="true"
                  />
                </span>
              </div>
              <p className="text-base text-muted-foreground">
                登録されている資材はまだありません。
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {manufacturer.products.map((p) => {
                const cardProduct: Product = {
                  id: p.id,
                  name: p.name,
                  maker_id: manufacturer.id,
                  maker_name: manufacturer.company_name,
                  type_id: null,
                  type_name: p.type_name,
                  image_url: p.image_url,
                  created_at: p.created_at,
                };
                return (
                  <li key={p.id} className="h-full">
                    {/* spec §6.2: 製造元詳細ページ内では company_name 重複表示を避ける */}
                    <ProductCard product={cardProduct} hideMakerName />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
