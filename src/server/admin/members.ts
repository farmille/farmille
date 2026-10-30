import type { Database } from "@/types/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** 運営の画面に出す一般会員。退会済みはニックネームを空けているので、退会した日時を持つ。 */
export type AdminMember =
  | { userId: string; handle: string; withdrawnAt: null }
  | { userId: string; handle: null; withdrawnAt: string };

/** ニックネームも退会の記録も無い行は null を返し、取得側でデータの欠落として扱う。 */
export function adminMember(
  row: Pick<ProfileRow, "user_id" | "handle" | "withdrawn_at">,
): AdminMember | null {
  if (row.withdrawn_at !== null) {
    return { userId: row.user_id, handle: null, withdrawnAt: row.withdrawn_at };
  }

  if (row.handle === null) return null;

  return { userId: row.user_id, handle: row.handle, withdrawnAt: null };
}
