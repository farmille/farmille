import { redirect } from "next/navigation";
import { Sprout } from "lucide-react";
import { getRole, getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { ProductForm } from "./_components/product-form";
import type {
  CategoryL1,
  CategoryL2,
  Crop,
} from "@/app/onboarding/farmer/_components/crop-picker";

type ProductType = { id: string; name: string };
type Benefit = {
  id: string;
  name: string;
  category: string;
  sort_order: number;
};
type Certification = { id: string; name: string };
type CropsMasterResponse = {
  categories_l1: CategoryL1[];
  categories_l2: CategoryL2[];
  crops: Crop[];
};

export default async function ProductNewPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/products/new");
  }
  // 2026-06-07: admin も「Farmille として」製品登録できる (backend 側で
  // maker_id が Farmille 公式アカウントに振られる)。
  const role = await getRole();
  if (role !== "maker" && role !== "admin") {
    redirect(landingPathForRole(role));
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login?next=/products/new");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const authHeaders = {
    Authorization: `Bearer ${session.access_token}`,
  };

  const [typesRes, benefitsRes, certsRes, cropsRes] = await Promise.all([
    // マスタ系（運用画面で月単位で更新される程度）は 1h cache で Server Component 時間を短縮
    fetch(`${apiUrl}/v1/product-types`, { next: { revalidate: 3600 } }),
    fetch(`${apiUrl}/v1/product-benefits`, { next: { revalidate: 3600 } }),
    fetch(`${apiUrl}/v1/certifications`, { next: { revalidate: 3600 } }),
    // /v1/onboarding/crops は JWT 必須なので fetch cache key に Authorization が
    // 混ざりやすく安全側で no-store のまま（ユーザー固有データではないが auth 任意化されるまで保留）
    fetch(`${apiUrl}/v1/onboarding/crops`, {
      headers: authHeaders,
      cache: "no-store",
    }),
  ]);

  if (!typesRes.ok) {
    throw new Error(`Failed to fetch product types: ${typesRes.status}`);
  }
  if (!benefitsRes.ok) {
    throw new Error(`Failed to fetch product benefits: ${benefitsRes.status}`);
  }
  if (!certsRes.ok) {
    throw new Error(`Failed to fetch certifications: ${certsRes.status}`);
  }
  if (!cropsRes.ok) {
    throw new Error(`Failed to fetch crops master: ${cropsRes.status}`);
  }

  const { product_types: productTypes } = (await typesRes.json()) as {
    product_types: ProductType[];
  };
  const { product_benefits: benefits } = (await benefitsRes.json()) as {
    product_benefits: Benefit[];
  };
  const { certifications } = (await certsRes.json()) as {
    certifications: Certification[];
  };
  const cropsData = (await cropsRes.json()) as CropsMasterResponse;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* AgList-inspired hero band (maker registration entry point). */}
      <section
        aria-label="ページヘッダー"
        className="border-b border-border"
        style={{ backgroundColor: "var(--green-subtle)" }}
      >
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 space-y-4">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "var(--overlay-on-light-soft)",
              color: "var(--green-dark)",
              borderRadius: "var(--radius-full)",
            }}
          >
            <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
            メーカー機能
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground"
            style={{ letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            資材を登録
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            基本情報と任意の効果タグ・対象作目・認証・画像を登録できます。
            必須項目は製品名のみです。
          </p>
        </div>
      </section>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full">
        <ProductForm
          productTypes={productTypes}
          benefits={benefits}
          certifications={certifications}
          crops={cropsData.crops}
          categoriesL1={cropsData.categories_l1}
          categoriesL2={cropsData.categories_l2}
        />
      </main>
    </div>
  );
}
