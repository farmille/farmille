// spec: docs/specs/maker-approval-admin.md §5.8
// gen:types 未適用のため admin BFF レスポンス型は本ファイルで手書き定義する。
// Sprint 4 で gen:types 後 database.types.ts ベースに切り替え予定。

export interface AdminSummary {
  pending_makers_count: number;
  active_makers_count: number;
  rejected_makers_count: number;
  total_users_count: number;
}

export interface PendingMaker {
  user_id: string;
  name: string;
  email: string;
  company_name: string | null;
  prefecture: string | null;
  city: string | null;
  note: string | null;
  created_at: string;
}

export interface PendingMakersResponse {
  makers: PendingMaker[];
  total: number;
}

export interface AdminMakerActionResp {
  ok: true;
  user_id: string;
  status: "active" | "rejected";
}
