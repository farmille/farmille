import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getRole, getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { ProductForm } from "@/app/products/new/_components/product-form";
import { publicUrlToPath } from "@/lib/supabase/paths";
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

type ProductDetail = {
  id: string;
  name: string;
  maker_id: string | null;
  type_id: string | null;
  general_purpose: string | null;
  primary_compound: string | null;
  mode_of_action: string | null;
  commercial_status: string | null;
  label_url: string | null;
  sds_url: string | null;
  images: Array<{ url: string; order: number }>;
  benefits: Array<{ id: string; name: string }>;
  crops: Array<{ id: string; name: string }>;
  certifications: Array<{ id: string; name: string }>;
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getUser();
  if (!user) {
    redirect(`/login?next=/products/${id}/edit`);
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
    redirect(`/login?next=/products/${id}/edit`);
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const authHeaders = {
    Authorization: `Bearer ${session.access_token}`,
  };

  const [productRes, typesRes, benefitsRes, certsRes, cropsRes] =
    await Promise.all([
      // 編集対象の products 行は所有権チェック + 最新値を見せたいので都度フェッチ
      fetch(`${apiUrl}/v1/products/${id}`, { cache: "no-store" }),
      // マスタ系は 1h cache で SSR 時間短縮
      fetch(`${apiUrl}/v1/product-types`, { next: { revalidate: 3600 } }),
      fetch(`${apiUrl}/v1/product-benefits`, { next: { revalidate: 3600 } }),
      fetch(`${apiUrl}/v1/certifications`, { next: { revalidate: 3600 } }),
      // /v1/onboarding/crops は JWT 必須のため no-store 維持（products/new と同方針）
      fetch(`${apiUrl}/v1/onboarding/crops`, {
        headers: authHeaders,
        cache: "no-store",
      }),
    ]);

  if (productRes.status === 404) {
    notFound();
  }
  if (!productRes.ok) {
    throw new Error(`Failed to fetch product: ${productRes.status}`);
  }
  if (!typesRes.ok || !benefitsRes.ok || !certsRes.ok || !cropsRes.ok) {
    throw new Error("Failed to fetch masters");
  }

  const product = (await productRes.json()) as ProductDetail;
  if (product.maker_id !== user.id) {
    // 他社 maker の資材を編集しようとした場合: 自分の資材一覧に戻す
    redirect(landingPathForRole(role));
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
              <Link href={`/products/${id}`}>詳細を見る</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 w-full space-y-6">
        <nav className="text-sm text-muted-foreground" aria-label="パンくず">
          <Link href="/maker/products" className="hover:text-primary">
            自社資材
          </Link>
          <span className="mx-2">›</span>
          <Link href={`/products/${id}`} className="hover:text-primary">
            {product.name}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">編集</span>
        </nav>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            資材を編集
          </h1>
          <p className="text-sm text-muted-foreground">
            基本情報と効果タグ・対象作目・認証を更新できます。
            既存画像の削除・並び替え + 新規追加に対応しています(最大 5 枚)。
          </p>
        </div>

        <ProductForm
          productTypes={productTypes}
          benefits={benefits}
          certifications={certifications}
          crops={cropsData.crops}
          categoriesL1={cropsData.categories_l1}
          categoriesL2={cropsData.categories_l2}
          mode="edit"
          productId={id}
          initialValues={{
            name: product.name,
            productTypeId: product.type_id ?? "",
            generalPurpose: product.general_purpose ?? "",
            primaryCompound: product.primary_compound ?? "",
            modeOfAction: product.mode_of_action ?? "",
            commercialStatus: product.commercial_status ?? "",
            labelUrl: product.label_url ?? "",
            sdsUrl: product.sds_url ?? "",
            benefitIds: product.benefits.map((b) => b.id),
            cropIds: product.crops.map((c) => c.id),
            certificationIds: product.certifications.map((c) => c.id),
            existingImages: product.images
              .map((img) => {
                const path = publicUrlToPath(img.url, "product-images");
                return path ? { url: img.url, path } : null;
              })
              .filter((x): x is { url: string; path: string } => x !== null),
          }}
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
