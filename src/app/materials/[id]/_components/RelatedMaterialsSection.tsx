import Link from "next/link";

import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { listRelatedMaterials, type MaterialDetail } from "@/server/queries/materials";

import { unwrapQueryResult } from "../query-result";
import { MockNoImage } from "./MockParts";

/** 見本の `.rt` の★（見本どおり `.stars` の大きさではなく `.rt` の文字の大きさで出す）。 */
function StarText({ value }: { value: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span role="img" aria-label={`5段階中${filled}`}>
      {"★".repeat(filled)}
      {"☆".repeat(5 - filled)}
    </span>
  );
}

/** 見本 S.material の関連見出し（`.sec-h`）。読み込み中の表示でも使う。 */
export function RelatedHeading() {
  return (
    <div className="sec-h" style={{ marginTop: 26 }}>
      <h2 id="related-materials-heading">関連する資材</h2>
    </div>
  );
}

/** 見本 S.material の box7。アプリの関連資材は「同じ資材ジャンルの公開資材」。感想口コミがある資材は見本の `.rt`（★と件数）を出す。 */
export async function RelatedMaterialsSection({ material }: { material: MaterialDetail }) {
  const related = unwrapQueryResult(
    await listRelatedMaterials(
      material.id,
      material.ingredientCategories.map(({ id }) => id),
    ),
  );
  return (
    <section aria-labelledby="related-materials-heading">
      <RelatedHeading />
      {related.length > 0 ? (
        <>
          <div className="muted" style={{ fontSize: 10.5, marginBottom: 6 }}>
            同じ資材ジャンルの資材
          </div>
          <div className="prod-scroll">
            {related.map((item) => (
              <Link key={item.id} href={`/materials/${item.id}`} className="prod-card">
                <div className="img">
                  {item.primaryImage ? (
                    <Image
                      alt=""
                      src={item.primaryImage.url}
                      width={300}
                      height={225}
                      sizes="150px"
                    />
                  ) : (
                    <MockNoImage />
                  )}
                </div>
                <div className="info">
                  <div className="nm">{item.name}</div>
                  <div
                    className="muted"
                    style={{
                      fontSize: 10.5,
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.manufacturer_name}
                  </div>
                  {item.review_count > 0 ? (
                    <div className="rt">
                      <StarText value={item.avg_rating ?? 0} />{" "}
                      <span className="muted tnum" style={{ fontSize: 10 }}>
                        {item.review_count}件
                      </span>
                    </div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <p className="muted" style={{ fontSize: 12 }}>
          同じ資材ジャンルの関連資材はありません。
        </p>
      )}
    </section>
  );
}
