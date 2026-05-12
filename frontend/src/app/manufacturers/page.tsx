import type { Metadata } from "next";
import Link from "next/link";
import {
  ManufacturerCard,
  type Manufacturer,
} from "./_components/manufacturer-card";

export const metadata: Metadata = {
  title: "メーカー一覧",
  description:
    "Farmille に登録されている BS 資材メーカー(企業)の公開一覧。各社の所在地と登録資材数が一覧できます。",
  openGraph: {
    title: "メーカー一覧 | Farmille",
    description:
      "Farmille に登録されている BS 資材メーカー(企業)の公開一覧。",
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
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Farmille
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/products" className="text-foreground hover:text-primary">
              資材一覧
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full space-y-10">
        <div className="space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            メーカー一覧
          </h1>
          <p className="text-base text-muted-foreground">
            Farmille に登録されている BS 資材メーカー (企業) を一覧表示しています。
          </p>
        </div>

        {manufacturers.length === 0 ? (
          <div
            className="border border-border bg-card p-12 text-center"
            style={{ borderRadius: "var(--radius-lg)" }}
          >
            <p className="text-base text-muted-foreground">
              メーカーがまだ登録されていません。
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {manufacturers.map((m) => (
              <li key={m.id}>
                <ManufacturerCard manufacturer={m} />
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}
