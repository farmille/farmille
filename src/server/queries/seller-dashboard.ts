import { fail, succeed, type Result } from "@/server/result";
import { createAdminSupabase, createServerSupabase } from "@/server/supabase";
import type { Database } from "@/types/database.types";

type SellerAccountRow = Database["public"]["Tables"]["seller_accounts"]["Row"];

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];

type MaterialChangeRequestRow = Database["public"]["Tables"]["material_change_requests"]["Row"];

type MaterialChangeRequestDetailRow =
  Database["public"]["Tables"]["material_change_request_details"]["Row"];

type DashboardSeller = Pick<
  SellerAccountRow,
  | "id"
  | "official_name"
  | "manufacturer_name"
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
  | "id"
  | "name"
  | "manufacturer_name"
  | "avg_rating"
  | "publication_status"
  | "manufacturer_verified_at"
  | "container_type_id"
>;

export type SellerDashboardData = {
  seller: DashboardSeller;
  materials: DashboardMaterial[];
};

export type SellerMaterialChangeRequest = Pick<
  MaterialChangeRequestRow,
  | "id"
  | "material_id"
  | "result_material_id"
  | "change_type"
  | "status"
  | "reason"
  | "submitted_at"
  | "reviewed_at"
  | "review_note"
  | "created_at"
  | "updated_at"
> & { materialName: string };

export type SellerMaterialsPageData = {
  sellerName: string;
  materials: DashboardMaterial[];
  changeRequests: SellerMaterialChangeRequest[];
};

export type SellerMaterialChangeRequestDetail = {
  request: SellerMaterialChangeRequest;
  proposal: MaterialChangeRequestDetailRow;
};

function reportQueryError<ErrorValue>(operation: string, error: ErrorValue): void {
  console.error(`[server/queries/seller-dashboard] ${operation}`, error);
}

/**
 * メーカーホーム用データ。
 * contact_* はカラム権限で本人セッションにも非公開のため、認証済み seller_id に
 * 絞ったメーカー情報だけを管理クライアントで読む。業務データは本人セッションで読む。
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
          manufacturer_name,
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
      .select(
        "id, name, manufacturer_name, avg_rating, publication_status, manufacturer_verified_at, container_type_id",
      )
      .eq("seller_id", sellerId)
      .order("name", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  if (sellerResult.error !== null) {
    reportQueryError("メーカー情報の取得に失敗", sellerResult.error);

    return fail("internal");
  }

  if (sellerResult.data === null) {
    reportQueryError("承認済みのメーカー情報が見つからない", { sellerId });

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

/** 自社資材と、対象未作成の新規登録申請を含む申請履歴を一覧する。 */
export async function getSellerMaterialsPageData(
  sellerId: string,
): Promise<Result<SellerMaterialsPageData>> {
  const dashboard = await getSellerDashboardData(sellerId);

  if (!dashboard.ok) return dashboard;

  const supabase = await createServerSupabase();

  const { data: requests, error } = await supabase
    .from("material_change_requests")
    .select(
      "id, material_id, result_material_id, change_type, status, reason, submitted_at, reviewed_at, review_note, created_at, updated_at",
    )
    .eq("seller_id", sellerId)
    .order("submitted_at", { ascending: false });

  if (error !== null) {
    reportQueryError("自社資材の申請一覧取得に失敗", error);

    return fail("internal");
  }

  const requestIds = requests.map(({ id }) => id);

  const detailsResult =
    requestIds.length === 0
      ? { data: [], error: null }
      : await supabase
          .from("material_change_request_details")
          .select("request_id, name")
          .in("request_id", requestIds);

  if (detailsResult.error !== null || detailsResult.data === null) {
    reportQueryError("申請資材名の取得に失敗", detailsResult.error);

    return fail("internal");
  }

  const names = new Map(detailsResult.data.map((detail) => [detail.request_id, detail.name]));
  const changeRequests: SellerMaterialChangeRequest[] = [];

  for (const request of requests) {
    const materialName = names.get(request.id);

    if (materialName === undefined) {
      reportQueryError("申請の資材名が見つからない", request);

      return fail("internal");
    }

    changeRequests.push({ ...request, materialName });
  }

  return succeed({
    sellerName: dashboard.data.seller.official_name,
    materials: dashboard.data.materials,
    changeRequests,
  });
}

/** メーカー本人の申請詳細。別メーカーの申請は存在を明かさない。 */
export async function getSellerMaterialChangeRequest(
  sellerId: string,
  requestId: string,
): Promise<Result<SellerMaterialChangeRequestDetail>> {
  const supabase = await createServerSupabase();

  const [requestResult, detailResult] = await Promise.all([
    supabase
      .from("material_change_requests")
      .select(
        "id, material_id, result_material_id, change_type, status, reason, submitted_at, reviewed_at, review_note, created_at, updated_at",
      )
      .eq("id", requestId)
      .eq("seller_id", sellerId)
      .maybeSingle(),
    supabase
      .from("material_change_request_details")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle(),
  ]);

  if (requestResult.error !== null || detailResult.error !== null) {
    reportQueryError("資材変更申請詳細の取得に失敗", requestResult.error ?? detailResult.error);

    return fail("internal");
  }

  if (requestResult.data === null || detailResult.data === null) return fail("not_found");

  return succeed({
    request: { ...requestResult.data, materialName: detailResult.data.name },
    proposal: detailResult.data,
  });
}
