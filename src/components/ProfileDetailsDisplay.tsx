import Link from "next/link";
import type { ProfileDetails } from "@/server/queries/profile-details";
import { STANDPOINTS } from "@/lib/standpoints";
import { PREFECTURES } from "@/lib/prefectures";
import { css } from "../../styled-system/css";

const section = css({ mt: "4", fontSize: "sm", textAlign: "left" });
const chip = css({
  display: "inline-block",
  px: "2",
  py: "1",
  mr: "1",
  mb: "1",
  borderRadius: "pill",
  bg: "brand.soft",
  color: "brand.primary",
});

/** 本人画面と公開画面で同じ公開情報を表示する。 */
export function ProfileDetailsDisplay({
  details,
  editable = false,
}: {
  details: ProfileDetails;
  editable?: boolean;
}) {
  const missing = [
    details.bio ? null : "自己紹介",
    details.crops.length ? null : "主な作目",
    details.affiliations.length ? null : "所属",
  ].filter(Boolean);
  return (
    <div className={section}>
      <p>
        {[
          STANDPOINTS.find((item) => item.value === details.standpoint)?.label,
          PREFECTURES.find((item) => item.code === details.prefecture_code)?.name,
          details.city,
        ]
          .filter(Boolean)
          .join(" ・ ")}
      </p>
      {details.affiliations.length > 0 && (
        <div aria-label="所属">
          {details.affiliations.map((name) => (
            <span key={name} className={chip}>
              {name}
            </span>
          ))}
        </div>
      )}
      {details.bio && (
        <p className={css({ whiteSpace: "pre-wrap", overflowWrap: "anywhere" })}>{details.bio}</p>
      )}
      {details.crops.length > 0 && (
        <div>
          <p className={css({ fontWeight: "700", mb: "1" })}>主な作目</p>
          {details.crops.map((crop) => (
            <span key={crop.id} className={chip}>
              {crop.name}
            </span>
          ))}
        </div>
      )}
      {details.links.length > 0 && (
        <ul className={css({ pl: "4", overflowWrap: "anywhere" })}>
          {details.links.map((url) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={css({ color: "brand.primary" })}
              >
                {url}
              </a>
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <p className={css({ color: "text.subtle" })}>
          {details.cityPublic ? "市区町村まで公開中" : "都道府県まで公開中"}
          。本名・連絡先は公開されません。
        </p>
      )}
      {editable && missing.length > 0 && (
        <p className={css({ bg: "brand.soft", p: "3", borderRadius: "card" })}>
          <Link href="/me/edit" className={css({ color: "brand.primary", fontWeight: "700" })}>
            {missing.join("・")}を設定して、プロフィールを充実させましょう。
          </Link>
        </p>
      )}
    </div>
  );
}
