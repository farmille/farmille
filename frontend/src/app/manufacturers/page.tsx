import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import {
  ManufacturerCard,
  type Manufacturer,
} from "./_components/manufacturer-card";

export const metadata: Metadata = {
  title: "製造元一覧",
  description:
    "Farmille に登録されている BS 資材製造元(企業)の公開一覧。各社の所在地と登録資材数が一覧できます。",
  openGraph: {
    title: "製造元一覧 | Farmille",
    description:
      "Farmille に登録されている BS 資材製造元(企業)の公開一覧。",
    url: "/manufacturers",
  },
};

type ManufacturersResponse = { manufacturers: Manufacturer[] };

export default async function ManufacturersPage() {
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(`${apiUrl}/v1/manufacturers`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch manufacturers: ${res.status}`);
  }
  const { manufacturers } = (await res.json()) as ManufacturersResponse;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* AgList-inspired hero — <section> to avoid double <header>. */}
      <section
        aria-label="ページヘッダー"
        className="border-b border-border"
        style={{ backgroundColor: "var(--green-subtle)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 space-y-5">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "var(--overlay-on-light-soft)",
              color: "var(--green-dark)",
              borderRadius: "var(--radius-full)",
            }}
          >
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            製造元ディレクトリ
          </div>
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground"
            style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            製造元一覧
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            BS 資材を製造・販売する各社を一覧できます。クリックすると、
            その会社の登録資材と所在地を確認できます。
          </p>
          <div className="flex items-center gap-3 pt-2">
            <span
              className="inline-flex items-center px-4 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "var(--green-primary)",
                color: "var(--text-on-green)",
                borderRadius: "var(--radius-full)",
              }}
            >
              {manufacturers.length} 社
            </span>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-8">
        {manufacturers.length === 0 ? (
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
                <Building2
                  className="h-7 w-7 text-[var(--green-primary)]"
                  aria-hidden="true"
                />
              </span>
            </div>
            <p className="text-base text-muted-foreground">
              製造元がまだ登録されていません。
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {manufacturers.map((m) => (
              <li key={m.id} className="h-full">
                <ManufacturerCard manufacturer={m} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
