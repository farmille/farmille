import { Icon } from "@/components/Icon";
import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { buttonRecipe } from "@/components/Button";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { PREFECTURES } from "@/lib/prefectures";
import { STANDPOINTS } from "@/lib/standpoints";
import type { ProfileDetails } from "@/server/queries/profile-details";
import { css, cva, cx } from "../../styled-system/css";

function linkLabel(url: string): string {
  const parsed = URL.parse(url);
  return parsed === null ? url : parsed.hostname.replace(/^www\./, "");
}

const card = css(surfaceCardRecipe.raw({ padding: "flush" }), { overflow: "hidden" });

// 上端に色の帯（カバー）を置かない。帯があると背景画像を設定できるように見えるが、その機能は無い。
const content = css({ px: "4.5", pt: "4.5", pb: "4" });

// 上から アバター → 名前 → 投稿数 を中央に、その下の詳細は左寄せ、最後に編集ボタンを全幅で置く。
const avatarFrame = css({ display: "flex", justifyContent: "center" });

const name = css({
  mt: "3",
  mb: "0",
  textAlign: "center",
  textStyle: "title",
  overflowWrap: "anywhere",
});

// 「属性」「地域」「所属」「栽培作目」は見出しの幅をそろえ、値の始まりを縦一列にする。
const labeledRow = cva({
  base: { display: "flex", alignItems: "flex-start", gap: "2" },
  variants: { spacing: { tight: { mt: "1.5" }, loose: { mt: "3" } } },
});

const label = css({
  flex: "none",
  w: "14",
  minH: "7",
  display: "flex",
  alignItems: "center",
  color: "text.subtle",
  textStyle: "note",
});

const values = css({
  flex: "1",
  minW: "0",
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "1.5",
  minH: "7",
});

// 作物名の途中ではなく「、」の位置で折り返す
const textValue = css({
  textStyle: "supporting",
  color: "text.default",
  wordBreak: "keep-all",
  overflowWrap: "anywhere",
});

const affiliation = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  px: "3",
  py: "1",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "accent.official/28",
  borderRadius: "pill",
  bg: "accent.official/12",
  color: "accent.official",
  fontSize: "xs",
  fontWeight: "bold",
  _before: { content: '""', w: "1.5", h: "1.5", borderRadius: "pill", bg: "currentColor" },
});

const editLink = css(buttonRecipe.raw({ variant: "ghost", size: "sm" }), {
  w: "full",
  mt: "4",
  whiteSpace: "nowrap",
});

const srOnly = css({ srOnly: true });

const bio = css({
  mt: "3",
  textStyle: "prose",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});

const linkRow = css({
  display: "flex",
  flexWrap: "wrap",
  gap: "3.5",
  mt: "2",
  fontSize: "sm",
  "& a": {
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    color: "text.brand",
    fontWeight: "semibold",
    textDecoration: "none",
    overflowWrap: "anywhere",
  },
});

const statRow = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  columnGap: "3",
  rowGap: "1",
  mt: "1.5",
  color: "text.subtle",
  fontSize: "sm",
  "& b": { color: "text.default", fontVariantNumeric: "tabular-nums" },
});

// 名前・投稿数の下を「詳細」として線で区切る。
const detailBlock = css({
  mt: "4",
  pt: "1",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
});

type ProfileCardProps = {
  handle: string;
  avatarUrl: string | null;
  details: ProfileDetails;
  stats: ReadonlyArray<{ label: string; value: number }>;
  /** 本人のマイページでは「プロフィールを編集」だけを足す。表示する中身は公開プロフィールと同じ。 */
  editable?: boolean;
};

export function ProfileCard({
  handle,
  avatarUrl,
  details,
  stats,
  editable = false,
}: ProfileCardProps) {
  const standpoint = STANDPOINTS.find((item) => item.value === details.standpoint)?.label;
  const prefecture = PREFECTURES.find((item) => item.code === details.prefecture_code)?.name;
  const hasDetails =
    Boolean(details.bio) ||
    standpoint !== undefined ||
    prefecture !== undefined ||
    details.affiliations.length > 0 ||
    details.crops.length > 0 ||
    details.links.length > 0;

  return (
    <section className={card} aria-labelledby="profile-handle">
      <div className={content}>
        <span className={avatarFrame}>
          <Avatar name={handle} src={avatarUrl} size="2xl" />
        </span>
        <h1 className={name} id="profile-handle">
          {handle}
        </h1>

        <div className={statRow}>
          {stats.map((stat) => (
            <span key={stat.label}>
              {stat.label} <b>{stat.value}</b>
            </span>
          ))}
        </div>

        {hasDetails ? (
          <div className={detailBlock}>
            {details.bio ? <p className={bio}>{details.bio}</p> : null}

            {standpoint ? (
              <div className={labeledRow({ spacing: "loose" })}>
                <span className={label}>属性</span>
                <div className={cx(values, textValue)}>{standpoint}</div>
              </div>
            ) : null}

            {prefecture ? (
              <div className={labeledRow({ spacing: standpoint ? "tight" : "loose" })}>
                <span className={label}>地域</span>
                <div className={cx(values, textValue)}>{prefecture}</div>
              </div>
            ) : null}

            {details.affiliations.length > 0 ? (
              <div className={labeledRow({ spacing: "tight" })}>
                <span className={label}>所属</span>
                <div className={values}>
                  {details.affiliations.map((affiliationName) => (
                    <span key={affiliationName} className={affiliation}>
                      {affiliationName}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {details.crops.length > 0 ? (
              <div className={labeledRow({ spacing: "loose" })}>
                <span className={label}>栽培作目</span>
                <div className={cx(values, textValue)}>
                  {details.crops.map((crop) => crop.name).join("、")}
                </div>
              </div>
            ) : null}

            {details.links.length > 0 ? (
              <div className={linkRow}>
                {details.links.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    <Icon name="open_in_new" size="2xs" /> {linkLabel(url)}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {editable ? (
          <Link className={editLink} href="/me/edit">
            プロフィールを編集<span className={srOnly}>（プロフィール公開情報を編集）</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
