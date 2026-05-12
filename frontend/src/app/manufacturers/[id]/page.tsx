import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    return { title: "メーカー詳細" };
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            {manufacturer.company_name}
          </h1>
          {location ? (
            <p className="text-base text-muted-foreground">{location}</p>
          ) : null}
          {manufacturer.note ? (
            <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
              {manufacturer.note}
            </p>
          ) : null}
        </section>

        <section className="space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            自社製品一覧
          </h2>

          {manufacturer.products.length === 0 ? (
            <div
              className="border border-border bg-card p-10 text-center"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <p className="text-base text-muted-foreground">
                登録されている資材はまだありません。
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <li key={p.id}>
                    {/* spec §6.2: メーカー詳細ページ内では company_name 重複表示を避ける */}
                    <ProductCard product={cardProduct} hideMakerName />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}
