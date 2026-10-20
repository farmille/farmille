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

import { Chip } from "@/app/materials/[id]/_components/CardParts";

function linkLabel(url: string): string {
  const parsed = URL.parse(url);
  return parsed === null ? url : parsed.hostname.replace(/^www\./, "");
}

const card = css(surfaceCardRecipe.raw({ padding: "flush" }), { overflow: "hidden" });

const cover = css({
  h: "36",
  bgImage:
    "linear-gradient(120deg, token(colors.primary.100), token(colors.primary.soft) 55%, token(colors.surface.page))",
});

const content = css({ px: "4.5", pb: "4" });

// 名前の列はカバー画像の下端から余白を取って始める（アバターの下端にそろえると名前がカバーに寄りすぎる）。
const headRow = css({ display: "flex", alignItems: "flex-start", flexWrap: "wrap", gap: "3.5" });

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

const nameColumn = css({ flex: "1", minW: "44", pt: "4" });

const name = css({
  m: "0",
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  columnGap: "2.5",
  rowGap: "1",
  textStyle: "title",
});

const chipRow = { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1.5" } as const;

const regionRow = css(chipRow, { mt: "1" });

const cropRow = css(chipRow, { mt: "2" });

const label = cva({
  base: { color: "text.subtle", textStyle: "note" },
  variants: { spaced: { true: { ml: "1.5" }, false: {} } },
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
          <div className={nameColumn}>
            <h1 className={name} id="profile-handle">
              <span>{handle}</span>
              {standpoint ? <Badge variant="type">{standpoint}</Badge> : null}
            </h1>
            {prefecture || details.affiliations.length > 0 ? (
              <div className={regionRow}>
                {prefecture ? (
                  <>
                    <span className={label({ spaced: false })}>地域</span>
                    <Chip>{prefecture}</Chip>
                  </>
                ) : null}
                {details.affiliations.length > 0 ? (
                  <>
                    <span className={label({ spaced: true })}>所属</span>
                    {details.affiliations.map((affiliationName) => (
                      <span key={affiliationName} className={affiliation}>
                        {affiliationName}
                      </span>
                    ))}
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          {editable ? (
            <Link className={editLink} href="/me/edit">
              プロフィールを編集<span className={srOnly}>（表示情報を編集）</span>
            </Link>
          ) : null}
        </div>

        {details.bio ? <p className={bio}>{details.bio}</p> : null}

        {details.crops.length > 0 ? (
          <div className={cropRow}>
            <span className={label({ spaced: false })}>主な作目</span>
            {details.crops.map((crop) => (
              <Chip key={crop.id} wrap>
                {crop.name}
              </Chip>
            ))}
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
