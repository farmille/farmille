import { Icon } from "@/components/Icon";
import Link from "next/link";

import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { buttonRecipe } from "@/components/Button";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { PREFECTURES } from "@/lib/prefectures";
import { STANDPOINTS } from "@/lib/standpoints";
import type { ProfileDetails } from "@/server/queries/profile-details";
import { css, cva } from "../../styled-system/css";

import { Chip } from "@/components/Chip";

function linkLabel(url: string): string {
  const parsed = URL.parse(url);
  return parsed === null ? url : parsed.hostname.replace(/^www\./, "");
}

const card = css(surfaceCardRecipe.raw({ padding: "flush" }), { overflow: "hidden" });

const cover = css({
  h: "36",
  bgImage:
    "[linear-gradient(120deg, {colors.primary.100}, {colors.primary.soft} 55%, {colors.surface.page})]",
});

const content = css({ px: "4.5", pb: "4" });

// アバターの行：左にカバーへ重なるアバター、右端に「プロフィールを編集」。
// 名前や所属の長さで編集ボタンの位置が動かないよう、名前の列はこの行の下に全幅で置く。
const headRow = css({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "3",
});

// カバー画像に重なるので、背景色の縁を回して輪郭を切る。
const avatarFrame = css({
  flex: "none",
  alignSelf: "flex-start",
  mt: "-8",
  display: "inline-flex",
  borderWidth: "3px",
  borderStyle: "solid",
  borderColor: "surface.card",
  borderRadius: "pill",
});

const nameColumn = css({ mt: "3" });

// 立場バッジは名前の文字の流れに入れ、名前が折り返しても最後の文字のすぐ後ろに続ける。
const name = css({ m: "0", textStyle: "title", overflowWrap: "anywhere" });

const standpointBadge = css({ ml: "2", verticalAlign: "[0.2em]", whiteSpace: "nowrap" });

// 「地域」「所属」「栽培作目」は見出しの幅をそろえ、値（チップ）の始まりを縦一列にする。
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
  flex: "none",
  px: "4",
  mt: "3",
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
  gap: "4",
  mt: "3",
  pt: "3",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  fontSize: "sm",
  "& b": { fontVariantNumeric: "tabular-nums" },
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

  return (
    <section className={card} aria-labelledby="profile-handle">
      <div className={cover} aria-hidden="true" />
      <div className={content}>
        <div className={headRow}>
          <span className={avatarFrame}>
            <Avatar name={handle} src={avatarUrl} size="xl" />
          </span>
          {editable ? (
            <Link className={editLink} href="/me/edit">
              プロフィールを編集<span className={srOnly}>（プロフィール公開情報を編集）</span>
            </Link>
          ) : null}
        </div>
        <div className={nameColumn}>
          <h1 className={name} id="profile-handle">
            {handle}
            {standpoint ? (
              <Badge variant="type" className={standpointBadge}>
                {standpoint}
              </Badge>
            ) : null}
          </h1>
          {prefecture ? (
            <div className={labeledRow({ spacing: "tight" })}>
              <span className={label}>地域</span>
              <div className={values}>
                <Chip size="xs">{prefecture}</Chip>
              </div>
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
        </div>

        {details.bio ? <p className={bio}>{details.bio}</p> : null}

        {details.crops.length > 0 ? (
          <div className={labeledRow({ spacing: "loose" })}>
            <span className={label}>栽培作目</span>
            <div className={values}>
              {details.crops.map((crop) => (
                <Chip key={crop.id} size="xs">
                  {crop.name}
                </Chip>
              ))}
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

        <div className={statRow}>
          {stats.map((stat) => (
            <span key={stat.label}>
              {stat.label} <b>{stat.value}</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
