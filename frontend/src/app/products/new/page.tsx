import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  const role = await getRole();
  if (role !== "maker") {
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
    fetch(`${apiUrl}/v1/product-types`, { cache: "no-store" }),
    fetch(`${apiUrl}/v1/product-benefits`, { cache: "no-store" }),
    fetch(`${apiUrl}/v1/certifications`, { cache: "no-store" }),
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
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Farmille
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/maker/products"
              className="text-foreground hover:text-primary"
            >
              自社資材
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/home">ホーム</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            資材を登録
          </h1>
          <p className="text-sm text-muted-foreground">
            基本情報と任意の効果タグ・対象作目・認証・画像を登録できます。
            必須項目は製品名とタイプのみです。
          </p>
        </div>

        <ProductForm
          productTypes={productTypes}
          benefits={benefits}
          certifications={certifications}
          crops={cropsData.crops}
          categoriesL1={cropsData.categories_l1}
          categoriesL2={cropsData.categories_l2}
        />
      </main>

      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-4xl mx-auto px-6 text-sm text-muted-foreground">
          <p>© 2026 Farmille</p>
        </div>
      </footer>
    </div>
  );
}
