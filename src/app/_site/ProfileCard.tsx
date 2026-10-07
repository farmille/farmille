import Link from "next/link";

import { Badge } from "@/components/Badge";
import { buttonRecipe } from "@/components/Button";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { PREFECTURES } from "@/lib/prefectures";
import { STANDPOINTS } from "@/lib/standpoints";
import type { ProfileDetails } from "@/server/queries/profile-details";
import { css, cva } from "../../../styled-system/css";

import { Chip, ExternalIcon } from "@/app/materials/[id]/_components/CardParts";

function initials(name: string): string {
  const text = name.trim();
  return text ? text.slice(0, 1).toUpperCase() : "?";
}

/** リンクの表示名（「ichigo-farm.com」のようにホスト名だけを出す）。 */
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

const avatar = css({
  flex: "0 0 auto",
  alignSelf: "flex-start",
  w: "20",
  h: "20",
  mt: "-8",
  display: "inline-grid",
  placeItems: "center",
  overflow: "hidden",
  borderWidth: "3px",
  borderStyle: "solid",
  borderColor: "surface.card",
  borderRadius: "pill",
  bg: "primary.100",
  color: "primary.800",
  fontSize: "3xl",
  fontWeight: "bold",
  lineHeight: "none",
  letterSpacing: "0.02em",
  "& img": { display: "block", w: "100%", h: "100%", objectFit: "cover" },
});

const nameColumn = css({ flex: "1", minW: "44", pb: "0.5" });

const name = css({ m: "0", fontSize: "lg", fontWeight: "extrabold" });

const chipRow = { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1.5" } as const;

const regionRow = css(chipRow, { mt: "1" });

const cropRow = css(chipRow, { mt: "2" });

const label = cva({
  base: { color: "text.subtle", fontSize: "xs" },
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
  flex: "0 0 auto",
  px: "4",
  py: "2",
  lineHeight: "normal",
});

const srOnly = css({ srOnly: true });

const bio = css({
  mt: "3",
  fontSize: "md",
  lineHeight: "prose",
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
    color: "primary.800",
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

const publicNote = css({ m: "0", color: "text.subtle", fontSize: "xs" });

const publicLink = css({ ml: "auto", fontSize: "sm", fontWeight: "bold" });

const todoHint = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1.5",
    color: "primary.800",
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
  flex: "0 0 auto",
  w: "4",
  h: "4",
  display: "grid",
  placeItems: "center",
  borderWidth: "1.5px",
  borderStyle: "dashed",
  borderColor: "primary.700",
  borderRadius: "pill",
  color: "primary.800",
  fontSize: "xs",
  fontWeight: "black",
  lineHeight: "none",
});

type ProfileCardProps = {
  handle: string;
  avatarUrl: string | null;
  details: ProfileDetails;
  stats: ReadonlyArray<{ label: string; value: number }>;
  /** 本人のマイページ（未設定の項目に「＋ 〜を設定する」を出し、編集ボタンを置く）。 */
  editable?: boolean;
  /** 本人の公開プロフィール（`/users/{id}`）。渡したときだけカードの末尾に「公開プロフィールを見る」を出す。 */
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

/**
 * マイページと公開プロフィールのカード（帯・アバター・名前・地域・所属・自己紹介・主な作目・リンク・数）。
 * 背景画像の欄は本番に無いため、帯は既定のグラデーションだけを出す。
 */
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
          <span className={avatar} aria-hidden="true">
            {avatarUrl ? (
              <Image alt="" src={avatarUrl} width={76} height={76} sizes="76px" />
            ) : (
              initials(handle)
            )}
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
                    <Chip>
                      {prefecture}
                      {details.city ? ` ${details.city}` : ""}
                    </Chip>
                    {editable && !details.cityPublic ? (
                      <TodoHint placement="inline">市区町村まで公開する場合はこちら</TodoHint>
                    ) : null}
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
                <ExternalIcon /> {linkLabel(url)}
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
              <p className={publicNote}>
                {details.cityPublic ? "市区町村まで公開中" : "都道府県まで公開中"}
                。本名・連絡先は公開されません。
              </p>
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
