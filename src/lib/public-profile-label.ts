import { PREFECTURES } from "./prefectures";
import { STANDPOINTS } from "./standpoints";
import type { Database } from "@/types/database.types";

type PublicProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];

/** 公開ビューの項目だけから、投稿者の肩書きを組み立てる。 */
export function publicProfileLabel(
  profile: Pick<PublicProfileRow, "standpoint" | "prefecture_code"> | null,
): string {
  if (profile === null) return "";
  return [
    STANDPOINTS.find((item) => item.value === profile.standpoint)?.label,
    PREFECTURES.find((item) => item.code === profile.prefecture_code)?.name,
  ]
    .filter(Boolean)
    .join(" ・ ");
}

export const WITHDRAWN_MEMBER_NAME = "退会済みユーザー";

/**
 * 投稿に添える投稿者。退会済みの会員は名前を「退会済みユーザー」にし、
 * アイコン（avatarUrl が null なので既定の画像）・肩書き・プロフィールへのリンクを持たない。
 */
export type PostAuthor = {
  name: string;
  avatarUrl: string | null;
  /** 立場と都道府県のうち、取得した項目だけを並べる。 */
  label: string;
  href: string | null;
};

/** 投稿に結び付いた公開ビューの行。アイコンと肩書きは、画面に出す項目だけを選んで取得する。 */
export type PostAuthorRow = Pick<PublicProfileRow, "user_id" | "withdrawn" | "handle"> &
  Partial<Pick<PublicProfileRow, "avatar_url" | "standpoint" | "prefecture_code">>;

/**
 * 投稿者の表示を決める唯一の関数。在籍中でも退会済みでもない形の行（結び付きの欠落を含む）は null を返し、
 * 取得側でデータの欠落として扱う。
 */
export function postAuthor(row: PostAuthorRow | null): PostAuthor | null {
  if (row === null || row.user_id === null) return null;
  if (row.withdrawn === true) {
    return { name: WITHDRAWN_MEMBER_NAME, avatarUrl: null, label: "", href: null };
  }
  if (row.withdrawn !== false || row.handle === null) return null;
  return {
    name: row.handle,
    avatarUrl: row.avatar_url ?? null,
    label: publicProfileLabel({
      standpoint: row.standpoint ?? null,
      prefecture_code: row.prefecture_code ?? null,
    }),
    href: `/users/${row.user_id}`,
  };
}
