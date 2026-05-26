import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminMakersResponse,
  AdminProductDetail,
  CertificationsResponse,
  CropsTreeResponse,
  ProductBenefitsResponse,
} from "@/types/admin";
import { ProductEditForm } from "./_components/edit-form";

export const metadata: Metadata = {
  title: "資材編集",
  description: "資材マスタ編集",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

// spec admin-aglist-alignment-v2.md §3.2: 資材編集画面 (v1 必達)。
// SSR で /v1/admin/products/{id} + マスタ 4 種 (makers / crops / certifications /
// benefits) を並列 fetch し、Client Island に props として渡す。
// PUT 提出は /api/admin/products/{id} 経由 (BFF 直叩き禁止、spec §6 R3 整合)。
// 新規作成 / 削除は v1 非対応。

export default async function AdminProductEditPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect(`/login?next=/admin/products/${encodeURIComponent(id)}`);
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const auth = { Authorization: `Bearer ${session.access_token}` };

  const [productRes, makersRes, cropsRes, certsRes, benefitsRes] =
    await Promise.all([
      fetch(`${apiUrl}/v1/admin/products/${encodeURIComponent(id)}`, {
        headers: auth,
        cache: "no-store",
      }),
      fetch(`${apiUrl}/v1/admin/makers?status=active`, {
        headers: auth,
        cache: "no-store",
      }),
      fetch(`${apiUrl}/v1/crops/tree`, { cache: "no-store" }),
      fetch(`${apiUrl}/v1/certifications`, { cache: "no-store" }),
      fetch(`${apiUrl}/v1/product-benefits`, { cache: "no-store" }),
    ]);

  if (productRes.status === 404) {
    notFound();
  }
  if (!productRes.ok) {
    throw new Error(
      `Failed to fetch /v1/admin/products/${id}: ${productRes.status}`,
    );
  }
  if (!makersRes.ok || !cropsRes.ok || !certsRes.ok || !benefitsRes.ok) {
    throw new Error("Failed to fetch master data for product edit");
  }

  const product = (await productRes.json()) as AdminProductDetail;
  const { makers } = (await makersRes.json()) as AdminMakersResponse;
  const { tree } = (await cropsRes.json()) as CropsTreeResponse;
  const { certifications } =
    (await certsRes.json()) as CertificationsResponse;
  const { product_benefits } =
    (await benefitsRes.json()) as ProductBenefitsResponse;

  // crops tree を leaf (approved crops) リストにフラット化 (multi-select 用)。
  // L1 > L2 の category を name の prefix として残し、視認性を確保する。
  const cropOptions = tree.flatMap((l1) =>
    l1.children.flatMap((l2) =>
      l2.children.map((c) => ({
        id: c.id,
        name: c.name,
        category: `${l1.name} / ${l2.name}`,
      })),
    ),
  );

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/admin/products" className="hover:underline">
            資材マスタ
          </Link>
          <span>/</span>
          <span>編集</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {product.name}
        </h1>
        <p className="text-xs text-muted-foreground">
          id: <span className="font-mono">{product.id}</span>
        </p>
      </header>

      <ProductEditForm
        product={product}
        makers={makers}
        cropOptions={cropOptions}
        certifications={certifications}
        benefits={product_benefits}
      />

      <section
        aria-label="使用レシピ"
        className="space-y-3 rounded-md border border-border bg-card p-5"
      >
        <h2 className="text-lg font-medium">
          使用レシピ ({product.recipes.length} 件)
        </h2>
        <p className="text-xs text-muted-foreground">
          v1 は read-only 表示のみ。レシピ単位の編集 UI は v1.5+ で対応予定 (spec §3.2 / Q-R2)。
        </p>
        {product.recipes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            紐づく使用レシピはまだありません。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-xs">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-2 py-1">対象作物</th>
                  <th className="px-2 py-1">栽培形態</th>
                  <th className="px-2 py-1">施用方法</th>
                  <th className="px-2 py-1">施用時期</th>
                  <th className="px-2 py-1">希釈倍率</th>
                  <th className="px-2 py-1">使用量</th>
                  <th className="px-2 py-1">最大使用量</th>
                  <th className="px-2 py-1">confidence</th>
                </tr>
              </thead>
              <tbody>
                {product.recipes.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 text-foreground"
                  >
                    <td className="px-2 py-1">
                      {[r.crop_category, r.crop_name]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>
                    <td className="px-2 py-1">{r.cultivation_type ?? "—"}</td>
                    <td className="px-2 py-1">{r.application_method ?? "—"}</td>
                    <td className="px-2 py-1">
                      {[r.application_timing, r.growth_stage]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>
                    <td className="px-2 py-1">{r.dilution_rate ?? "—"}</td>
                    <td className="px-2 py-1">
                      {r.dose_raw_text ??
                        (r.dose_amount !== null
                          ? `${r.dose_amount}${r.dose_unit ?? ""}`
                          : "—")}
                    </td>
                    <td className="px-2 py-1">
                      {r.max_dose_raw_text ??
                        (r.max_dose_amount !== null
                          ? `${r.max_dose_amount}${r.max_dose_unit ?? ""}`
                          : "—")}
                    </td>
                    <td className="px-2 py-1">{r.confidence ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
