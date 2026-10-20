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

const headRow = css({ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: "3.5" });

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

const nameColumn = css({ flex: "1", minW: "44", pb: "0.5" });

const name = css({ m: "0", textStyle: "title" });

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
});

const srOnly = css({ srOnly: true });

const bio = css({
  mt: "3",
  textStyle: "prose",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});

const emptyRow = css({ mt: "3", fontSize: "sm" });

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

const footRow = css({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "2.5",
  mt: "2",
});

const publicNote = css({ m: "0", color: "text.subtle", textStyle: "note" });

const publicLink = css({ ml: "auto", fontSize: "sm", fontWeight: "bold" });

const todoHint = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    color: "text.brand",
    fontSize: "sm",
    fontWeight: "bold",
    textDecoration: "none",
    _hover: { textDecoration: "underline" },
  },
  variants: {
    placement: {
      block: { mt: "1" },
      afterLabel: { mt: "0.5" },
      inline: { ml: "1", fontSize: "xs" },
    },
  },
});

const todoIcon = css({
  flex: "none",
  w: "4",
  h: "4",
  display: "grid",
  placeItems: "center",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "primary.700",
  borderRadius: "pill",
  color: "text.brand",
  fontSize: "xs",
  fontWeight: "black",
  lineHeight: "none",
});

type ProfileCardProps = {
  handle: string;
  avatarUrl: string | null;
  details: ProfileDetails;
  stats: ReadonlyArray<{ label: string; value: number }>;
  editable?: boolean;
  publicProfileHref?: string;
};

function TodoHint({
  children,
  placement = "block",
}: {
  children: string;
  placement?: "block" | "afterLabel" | "inline";
}) {
  return (
    <Link className={todoHint({ placement })} href="/me/edit">
      <span className={todoIcon} aria-hidden="true">
        ＋
      </span>
      {children}
    </Link>
  );
}

export function ProfileCard({
  handle,
  avatarUrl,
  details,
  stats,
  editable = false,
  publicProfileHref,
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
              <span>{handle}</span> {standpoint ? <Badge variant="type">{standpoint}</Badge> : null}
            </h1>
            {editable && !avatarUrl ? <TodoHint>プロフィール画像を設定する</TodoHint> : null}
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

        {details.bio ? (
          <p className={bio}>{details.bio}</p>
        ) : editable ? (
          <div className={emptyRow}>
            <span className={label({ spaced: false })}>自己紹介</span>{" "}
            <TodoHint placement="afterLabel">自己紹介を追加する</TodoHint>
          </div>
        ) : null}

        {details.crops.length > 0 ? (
          <div className={cropRow}>
            <span className={label({ spaced: false })}>主な作目</span>
            {details.crops.map((crop) => (
              <Chip key={crop.id} wrap>
                {crop.name}
              </Chip>
            ))}
          </div>
        ) : editable ? (
          <div className={css({ mt: "2", fontSize: "sm" })}>
            <span className={label({ spaced: false })}>主な作目</span>{" "}
            <TodoHint placement="afterLabel">主な作目を追加する</TodoHint>
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
        {editable || publicProfileHref ? (
          <div className={footRow}>
            {editable ? (
              <p className={publicNote}>都道府県まで公開中。本名・連絡先は公開されません。</p>
            ) : null}
            {publicProfileHref ? (
              <Link href={publicProfileHref} className={publicLink}>
                公開プロフィールを見る →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
