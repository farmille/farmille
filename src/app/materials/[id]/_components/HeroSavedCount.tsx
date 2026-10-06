import { getMaterialSavedCount } from "@/server/queries/catalog-search";

/** 資材ページ上部のお気に入り数。ホーム・検索の資材カードと同じ集計を使う（掲載終了の資材は「−」）。 */
export async function HeroSavedCount({ materialId }: { materialId: string }) {
  const count = await getMaterialSavedCount(materialId);
  return <b className="tnum">{count ?? "−"}</b>;
}
