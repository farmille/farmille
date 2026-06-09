import type { Metadata } from "next";
import { Sprout, SlidersHorizontal } from "lucide-react";
import { TypeFilter } from "./_components/type-filter";
import { ProductCard, type Product } from "./_components/product-card";
import { ProductsSearchBar } from "./_components/products-search-bar";

export const metadata: Metadata = {
  title: "資材一覧",
  description:
    "BS 資材(生物・微生物農業資材)をタイプ別に探せます。農家のレビュー付き。",
  openGraph: {
    title: "資材一覧 | Farmille",
    description:
      "BS 資材(生物・微生物農業資材)をタイプ別に探せます。農家のレビュー付き。",
    url: "/products",
  },
};

type ProductType = { id: string; name: string };
type ProductsResponse = { products: Product[] };
type ProductTypesResponse = { product_types: ProductType[] };

type PageProps = {
  searchParams?: Promise<{ type_id?: string; q?: string }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const typeId = params.type_id ?? null;
  // 検索キーワードは backend `Query(max_length=100)` に揃えてここでも 100 文字でカット。
  const q = (params.q ?? "").trim().slice(0, 100);

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const productsQuery = new URLSearchParams();
  if (typeId) productsQuery.set("type_id", typeId);
  if (q) productsQuery.set("q", q);
  const productsQs = productsQuery.toString();
  const productsUrl = productsQs
    ? `${apiUrl}/v1/products?${productsQs}`
    : `${apiUrl}/v1/products`;

  // 2026-06-10 根本さん指示: 作目での絞り込みは現状データが揃わず使えないため削除。
  // backend は引き続き crop_id を受け付ける（既存リンク互換）が、UI からは外す。
  const [productsRes, typesRes] = await Promise.all([
    fetch(productsUrl, { cache: "no-store" }),
    fetch(`${apiUrl}/v1/product-types`, { next: { revalidate: 3600 } }),
  ]);

  if (!productsRes.ok) {
    throw new Error(`Failed to fetch products: ${productsRes.status}`);
  }
  if (!typesRes.ok) {
    throw new Error(`Failed to fetch product types: ${typesRes.status}`);
  }

  const { products } = (await productsRes.json()) as ProductsResponse;
  const { product_types: productTypes } =
    (await typesRes.json()) as ProductTypesResponse;

  const selectedType = typeId
    ? (productTypes.find((t) => t.id === typeId) ?? null)
    : null;
  const isFiltered = typeId !== null || q.length > 0;

  const activeFilterChips: string[] = [];
  if (q) activeFilterChips.push(`キーワード: ${q}`);
  if (selectedType) activeFilterChips.push(`タイプ: ${selectedType.name}`);

  // タイプフィルタは active なタイプが 2 件以上ある時だけ意味を持つ。現状は
  // BS資材のみ active のため非表示。作目フィルタ撤去後にこれも無いと「絞り込み」
  // パネルが空箱になるので、表示すべきフィルタが無い時はパネルごと出さない。
  const showFilterPanel = productTypes.length > 1;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* AgList-inspired hero — large title against a soft green tint, key
          subtitle, and at-a-glance count. <section> not <header> to avoid
          nesting a second <header> inside the global SiteHeader. */}
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
            <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
            BS 資材データベース
          </div>
          <h1
            className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground"
            style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            資材一覧
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            生物・微生物農業資材 (BS資材) を探せます。
            農家・JA 普及員・研究者によるレビューで意思決定をサポート。
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
              {products.length} 件
            </span>
            {activeFilterChips.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">
                  絞り込み中:
                </span>
                {activeFilterChips.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-foreground"
                    style={{
                      backgroundColor: "var(--overlay-on-light-soft)",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 w-full space-y-6">
        {/* 検索バー — AgList /products の search 相当。q を URL に反映。
            資材名・和名に加えて製造元(販売元含む)でも引けるよう backend を拡張済。 */}
        <ProductsSearchBar initialQuery={q} />

        {/* フィルタ panel — 表示すべきフィルタがある時だけ出す */}
        {showFilterPanel && (
          <section
            aria-label="フィルタ"
            className="space-y-5 border border-border bg-card p-5 md:p-6"
            style={{
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-center gap-2 text-foreground">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-semibold">絞り込み</span>
            </div>
            <TypeFilter types={productTypes} selectedTypeId={typeId} />
          </section>
        )}

        {products.length === 0 ? (
          <EmptyState
            isFiltered={isFiltered}
            typeName={selectedType?.name ?? null}
            keyword={q || null}
          />
        ) : (
          <section aria-label="資材一覧">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function EmptyState({
  isFiltered,
  typeName,
  keyword,
}: {
  isFiltered: boolean;
  typeName: string | null;
  keyword: string | null;
}) {
  const filterLabels: string[] = [];
  if (keyword) filterLabels.push(`キーワード「${keyword}」`);
  if (typeName) filterLabels.push(`タイプ「${typeName}」`);

  return (
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
      <p className="text-lg font-semibold text-foreground">
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
