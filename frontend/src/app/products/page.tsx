import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { TypeFilter } from "./_components/type-filter";
import { ProductCard, type Product } from "./_components/product-card";
import {
  CropCascadeFilter,
  type L1Node,
} from "./_components/crop-cascade-filter";

const REVIEWER_ROLES = new Set(["farmer", "researcher", "ja_staff"]);

export const metadata: Metadata = {
  title: "資材一覧",
  description:
    "BS 資材(生物・微生物農業資材)を作目・タイプ別に探せます。農家のレビュー付き。",
  openGraph: {
    title: "資材一覧 | Farmille",
    description:
      "BS 資材(生物・微生物農業資材)を作目・タイプ別に探せます。農家のレビュー付き。",
    url: "/products",
  },
};

type ProductType = { id: string; name: string };
type ProductsResponse = { products: Product[] };
type ProductTypesResponse = { product_types: ProductType[] };
type CropsTreeResponse = { tree: L1Node[] };

type PageProps = {
  searchParams?: Promise<{ type_id?: string; crop_id?: string }>;
};

function findCropName(tree: L1Node[], cropId: string): string | null {
  for (const l1 of tree) {
    for (const l2 of l1.children) {
      const c = l2.children.find((x) => x.id === cropId);
      if (c) return c.name;
    }
  }
  return null;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const typeId = params.type_id ?? null;
  const cropId = params.crop_id ?? null;

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const user = await getUser();
  const role = user ? await getRole(user) : null;
  const isReviewer = role !== null && REVIEWER_ROLES.has(role);

  const productsQuery = new URLSearchParams();
  if (typeId) productsQuery.set("type_id", typeId);
  if (cropId) productsQuery.set("crop_id", cropId);
  const productsQs = productsQuery.toString();
  const productsUrl = productsQs
    ? `${apiUrl}/v1/products?${productsQs}`
    : `${apiUrl}/v1/products`;

  const [productsRes, typesRes, treeRes] = await Promise.all([
    fetch(productsUrl, { cache: "no-store" }),
    fetch(`${apiUrl}/v1/product-types`, { cache: "no-store" }),
    fetch(`${apiUrl}/v1/crops/tree`, { cache: "no-store" }),
  ]);

  if (!productsRes.ok) {
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  }
  if (!typesRes.ok) {
    throw new Error(`Failed to fetch product types: ${typesRes.status}`);
  }
  if (!treeRes.ok) {
    throw new Error(`Failed to fetch crops tree: ${treeRes.status}`);
  }

  const { products } = (await productsRes.json()) as ProductsResponse;
  const { product_types: productTypes } =
    (await typesRes.json()) as ProductTypesResponse;
  const { tree } = (await treeRes.json()) as CropsTreeResponse;

  const selectedType = typeId
    ? productTypes.find((t) => t.id === typeId) ?? null
    : null;
  const selectedCropName = cropId ? findCropName(tree, cropId) : null;
  const isFiltered = typeId !== null || cropId !== null;

  const headerSubtitle = (() => {
    const parts: string[] = [];
    if (selectedType) parts.push(`タイプ「${selectedType.name}」`);
    if (selectedCropName) parts.push(`作目「${selectedCropName}」`);
    if (parts.length === 0) return "登録されている全ての資材";
    return `${parts.join(" / ")}で絞り込み中`;
  })();

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
            {isReviewer && (
              <Link
                href="/me/reviews"
                className="text-foreground hover:text-primary"
              >
                自分のレビュー
              </Link>
            )}
            {user ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/home">ホーム</Link>
              </Button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-foreground hover:text-primary"
                >
                  ログイン
                </Link>
                <Button asChild size="sm">
                  <Link href="/signup">新規登録</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            資材一覧
          </h1>
          <p className="text-base text-muted-foreground">{headerSubtitle}</p>
        </div>

        <div className="space-y-4">
          <TypeFilter types={productTypes} selectedTypeId={typeId} />
          <CropCascadeFilter
            key={cropId ?? "none"}
            tree={tree}
            selectedCropId={cropId}
          />
        </div>

        {products.length === 0 ? (
          <EmptyState
            isFiltered={isFiltered}
            typeName={selectedType?.name ?? null}
            cropName={selectedCropName}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
          <nav className="flex items-center gap-4">
            <Link href="/login" className="hover:text-primary">
              ログイン
            </Link>
            <Link href="/signup" className="hover:text-primary">
              新規登録
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function EmptyState({
  isFiltered,
  typeName,
  cropName,
}: {
  isFiltered: boolean;
  typeName: string | null;
  cropName: string | null;
}) {
  const filterLabels: string[] = [];
  if (typeName) filterLabels.push(`タイプ「${typeName}」`);
  if (cropName) filterLabels.push(`作目「${cropName}」`);

  return (
    <div className="rounded-md border border-border bg-card p-10 text-center space-y-3">
      <p className="text-lg font-medium text-foreground">
        {isFiltered && filterLabels.length > 0
          ? `${filterLabels.join(" / ")}に該当する資材は見つかりませんでした`
          : "資材データがまだ登録されていません"}
      </p>
      <p className="text-sm text-muted-foreground">
        {isFiltered
          ? "別の条件で絞り込むか、フィルタをクリアしてすべての資材を表示してください。"
          : "メーカーによる資材登録をお待ちください。"}
      </p>
    </div>
  );
}
