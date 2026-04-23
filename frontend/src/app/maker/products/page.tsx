import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getRole, getSession, getUser } from "@/lib/auth/server";
import { ProductCard, type Product } from "@/app/products/_components/product-card";

type MakerProduct = {
  id: string;
  name: string;
  type_name: string | null;
  image_url: string | null;
  created_at: string | null;
};

type MakerProductsResponse = { products: MakerProduct[] };

export default async function MakerProductsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/maker/products");
  }
  const role = await getRole();
  if (role !== "maker") {
    redirect("/home");
  }

  const session = await getSession();
  if (!session) {
    redirect("/login?next=/maker/products");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const res = await fetch(`${apiUrl}/v1/maker/products`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch maker products: ${res.status}`);
  }

  const { products } = (await res.json()) as MakerProductsResponse;

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
            <Link href="/home" className="text-foreground hover:text-primary">
              ホーム
            </Link>
            <Button asChild size="sm">
              <Link href="/products/new">新規登録</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-8">
        <div className="flex items-baseline justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              自社資材
            </h1>
            <p className="text-sm text-muted-foreground">
              {products.length} 件
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-10 text-center space-y-4">
            <p className="text-foreground">
              まだ資材を登録していません。
            </p>
            <Button asChild>
              <Link href="/products/new">最初の資材を登録する</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const cardProduct: Product = {
                id: p.id,
                name: p.name,
                maker_id: null,
                maker_name: "", // 自社資材一覧なのでメーカー名表示はスキップ
                type_id: null,
                type_name: p.type_name,
                image_url: p.image_url,
                created_at: p.created_at,
              };
              return (
                <li key={p.id}>
                  <ProductCard product={cardProduct} />
                </li>
              );
            })}
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
