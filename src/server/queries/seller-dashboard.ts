import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type SellerAccountRow = Database["public"]["Tables"]["seller_accounts"]["Row"];
type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type MaterialEvidenceRow = Database["public"]["Tables"]["material_evidences"]["Row"];
type MaterialEditRequestRow = Database["public"]["Tables"]["material_edit_requests"]["Row"];
type TagRow = Database["public"]["Tables"]["tags"]["Row"];

type DashboardSeller = Pick<
  SellerAccountRow,
  | "id"
  | "official_name"
  | "seller_type"
  | "login_id"
  | "contact_email"
  | "contact_name"
  | "location"
  | "region_scope"
  | "website_url"
  | "logo_url"
  | "profile_text"
  | "status"
  | "approved_at"
>;

export type DashboardMaterial = Pick<
  MaterialRow,
  "id" | "name" | "manufacturer_name" | "avg_rating"
>;

export type SellerDashboardData = {
  seller: DashboardSeller;
  materials: DashboardMaterial[];
};

export type SellerMaterialTag = Pick<TagRow, "id" | "name" | "category" | "sort_order">;

export type SellerMaterialEvidence = Pick<
  MaterialEvidenceRow,
  "id" | "evidence_type" | "title" | "file_url" | "external_url" | "sort_order" | "created_at"
>;

type SellerMaterialFields = Pick<
  MaterialRow,
  | "id"
  | "name"
  | "manufacturer_name"
  | "product_type"
  | "jbsa_class"
  | "sales_status"
  | "description"
  | "general_use"
  | "ingredients"
  | "mechanism"
  | "usage_text"
  | "price_range"
  | "official_url"
  | "catalog_url"
>;

export type SellerMaterialDetail = SellerMaterialFields & {
  tags: SellerMaterialTag[];
  evidences: SellerMaterialEvidence[];
};

export type SellerEditRequest = Pick<
  MaterialEditRequestRow,
  "id" | "request_text" | "status" | "created_at" | "updated_at"
>;

export type SellerMaterialPageData = {
  material: SellerMaterialDetail;
  editRequests: SellerEditRequest[];
};

type MaterialTagRelation = {
  tags: SellerMaterialTag | null;
};

type SellerMaterialQueryRow = SellerMaterialFields & {
  material_evidences: SellerMaterialEvidence[];
  material_tags: MaterialTagRelation[];
};

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/seller-dashboard] ${operation}`, error);
}

function bySortOrder(
  left: { id: string; sort_order: number },
  right: { id: string; sort_order: number },
): number {
  return left.sort_order - right.sort_order || left.id.localeCompare(right.id);
}

/**
 * 出品者ホーム用データ。
 * contact_* はカラム権限で本人セッションにも非公開のため、認証済み seller_id に
 * 絞った組織情報だけを管理クライアントで読む。業務データは本人セッションで読む。
 */
export async function getSellerDashboardData(
  sellerId: string,
): Promise<Result<SellerDashboardData>> {
  const admin = createAdminSupabase();
  const supabase = await createServerSupabase();
  const [sellerResult, materialsResult] = await Promise.all([
    admin
      .from("seller_accounts")
      .select(
        `
          id,
          official_name,
          seller_type,
          login_id,
          contact_email,
          contact_name,
          location,
          region_scope,
          website_url,
          logo_url,
          profile_text,
          status,
          approved_at
        `,
      )
      .eq("id", sellerId)
      .eq("status", "approved")
      .maybeSingle(),
    supabase
      .from("materials")
      .select("id, name, manufacturer_name, avg_rating")
      .eq("seller_id", sellerId)
      .order("name", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (sellerResult.error !== null) {
    reportQueryError("組織情報の取得に失敗", sellerResult.error);
    return fail("internal");
  }

  if (sellerResult.data === null) {
    reportQueryError("承認済みの組織情報が見つからない", { sellerId });
    return fail("forbidden");
  }

  if (materialsResult.error !== null) {
    reportQueryError("自社資材一覧の取得に失敗", materialsResult.error);
    return fail("internal");
  }

  const seller: DashboardSeller = sellerResult.data;
  const materials: DashboardMaterial[] = materialsResult.data;

  return succeed({ seller, materials });
}

/** 自社資材だけを取得する。所有者が違う場合も存在を明かさず not_found にする。 */
export async function getSellerMaterialPageData(
  sellerId: string,
  materialId: string,
): Promise<Result<SellerMaterialPageData>> {
  const supabase = await createServerSupabase();
  const [materialResult, requestsResult] = await Promise.all([
    supabase
      .from("materials")
      .select(
        `
          id,
          name,
          manufacturer_name,
          product_type,
          jbsa_class,
          sales_status,
          description,
          general_use,
          ingredients,
          mechanism,
          usage_text,
          price_range,
          official_url,
          catalog_url,
          material_evidences (
            id,
            evidence_type,
            title,
            file_url,
            external_url,
            sort_order,
            created_at
          ),
          material_tags (
            tags (
              id,
              name,
              category,
              sort_order
            )
          )
        `,
      )
      .eq("id", materialId)
      .eq("seller_id", sellerId)
      .maybeSingle(),
    supabase
      .from("material_edit_requests")
      .select("id, request_text, status, created_at, updated_at")
      .eq("material_id", materialId)
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true }),
  ]);

  if (materialResult.error !== null) {
    reportQueryError("自社資材の取得に失敗", materialResult.error);
    return fail("internal");
  }

  if (materialResult.data === null) {
    return fail("not_found");
  }

  if (requestsResult.error !== null) {
    reportQueryError("分類変更申請履歴の取得に失敗", requestsResult.error);
    return fail("internal");
  }

  const { material_evidences, material_tags, ...materialFields }: SellerMaterialQueryRow =
    materialResult.data;
  const editRequests: SellerEditRequest[] = requestsResult.data;

  return succeed({
    material: {
      ...materialFields,
      evidences: material_evidences.toSorted(bySortOrder),
      tags: material_tags
        .flatMap(({ tags }) => (tags === null ? [] : [tags]))
        .toSorted(
          (left, right) => left.category.localeCompare(right.category) || bySortOrder(left, right),
        ),
    },
    editRequests,
  });
}
