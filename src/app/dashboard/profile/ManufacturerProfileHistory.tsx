import Link from "next/link";
import * as v from "valibot";
import { formatDateJa } from "@/components";
import { MATERIAL_PAGE_STATUS_LABELS } from "@/lib/material-page-editor";
import type { Tables } from "@/types/database.types";

import {
  cardList,
  logDate,
  logRow,
  logText,
  sectionHeading,
  sectionNote,
  visuallyHidden,
} from "../_components/dashboard-styles";

const versionStatusSchema = v.picklist([
  "draft",
  "pending",
  "published",
  "returned",
  "superseded",
  "withdrawn",
]);

export function ManufacturerProfileHistory({
  versions,
}: {
  versions: Pick<
    Tables<"manufacturer_profile_versions">,
    "id" | "status" | "created_at" | "review_note"
  >[];
}) {
  return (
    <section aria-labelledby="profile-history-heading">
      <h2 id="profile-history-heading" className={sectionHeading}>
        変更履歴
      </h2>
      <p className={sectionNote}>プロフィールへの変更の記録です。</p>
      <ul className={cardList}>
        {versions.length === 0 ? (
          <li className={logRow}>
            <div className={logText}>保存したプロフィールはありません。</div>
          </li>
        ) : (
          versions.map((version) => {
            const status = v.parse(versionStatusSchema, version.status);
            return (
              <li className={logRow} key={version.id}>
                <span className={logDate}>{formatDateJa(version.created_at)}</span>
                <div className={logText}>
                  <Link href={`/dashboard/profile/history/${version.id}`}>
                    {MATERIAL_PAGE_STATUS_LABELS[status]}
                    <span className={visuallyHidden}>（{formatDateJa(version.created_at)}）</span>
                  </Link>
                  {version.review_note ? `／${version.review_note}` : ""}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
