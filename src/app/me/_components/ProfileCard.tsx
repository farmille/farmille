import { OptimizedImage as Image } from "@/components/OptimizedImage";
import Link from "next/link";

import { Badge, buttonRecipe } from "@/components";
import { PersonIcon } from "@/components/Icons";
import type { OwnProfile } from "@/server/queries/profiles";
import { css, cx } from "../../../../styled-system/css";

const card = css({
  px: "3.5",
  py: "4.5",
  textAlign: "center",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
});

const avatar = css({
  w: "70px",
  aspectRatio: "image.square",
  mx: "auto",
  borderRadius: "pill",
  bg: "brand.soft",
  color: "brand.primary",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
});

const rows = css({
  mt: "3.5",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  textAlign: "left",
});

const row = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  px: "0.5",
  py: "2.5",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  _last: {
    borderBottomWidth: "0",
  },
});

const label = css({
  flex: "0 0 74px",
  color: "text.subtle",
  fontSize: "xs",
});

const value = css({
  flex: "1",
  minW: "0",
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  flexWrap: "wrap",
  fontSize: "sm",
});

const chip = css({
  display: "inline-flex",
  px: "2.5",
  py: "0.5",
  borderRadius: "pill",
  bg: "brand.soft",
  color: "brand.primaryDeep",
  fontSize: "xs",
  fontWeight: "600",
  whiteSpace: "nowrap",
});

const affiliationBadge = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  px: "2.5",
  py: "0.5",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "blue/28",
  borderRadius: "pill",
  bg: "blue/12",
  color: "accent.official",
  fontSize: "xs",
  fontWeight: "700",
  _before: {
    content: '""',
    w: "1.5",
    h: "1.5",
    borderRadius: "pill",
    bg: "currentColor",
  },
});

const externalLink = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  color: "brand.primary",
  textDecoration: "none",
});

function checkedExternalUrl(value: string, labelText: string): URL {
  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${labelText}はHTTPまたはHTTPSのURLで指定してください。`);
  }

  return url;
}

type ProfileCardProps = {
  profile: OwnProfile;
  prefectureName: string;
};

/** マイページ用プロフィールカード（地域の公開バッジ付き）。 */
export function ProfileCard({ profile, prefectureName }: ProfileCardProps) {
  const website = profile.websiteUrl
    ? checkedExternalUrl(profile.websiteUrl, "ウェブサイトURL")
    : null;
  const sns = profile.snsUrl ? checkedExternalUrl(profile.snsUrl, "SNS URL") : null;

  return (
    <section className={card} aria-labelledby="me-handle">
      <div className={avatar}>
        {profile.avatarUrl ? (
          <Image
            alt=""
            className={css({
              display: "block",
              w: "100%",
              h: "100%",
              objectFit: "cover",
            })}
            height={70}
            sizes="70px"
            src={profile.avatarUrl}
            width={70}
          />
        ) : (
          <PersonIcon size={32} />
        )}
      </div>
      <h1 id="me-handle" className={css({ mt: "2.5", mb: "0", fontSize: "xl", fontWeight: "800" })}>
        {profile.handle}
      </h1>

      <div className={rows}>
        <div className={row}>
          <span className={label}>地域</span>
          <span className={value}>
            {prefectureName}
            <Badge variant={profile.prefecturePublic ? "published" : "optional"}>
              {profile.prefecturePublic ? "公開" : "非公開"}
            </Badge>
          </span>
        </div>
        {profile.crops.length > 0 ? (
          <div className={row}>
            <span className={label}>主な作目</span>
            <span className={value}>
              {profile.crops.map((crop) => (
                <span key={crop.id} className={chip}>
                  {crop.name}
                </span>
              ))}
            </span>
          </div>
        ) : null}
        {profile.cultivationStyles.length > 0 ? (
          <div className={row}>
            <span className={label}>栽培形態</span>
            <span className={value}>
              {profile.cultivationStyles.map((style) => (
                <span key={style} className={chip}>
                  {style}
                </span>
              ))}
            </span>
          </div>
        ) : null}
        {profile.affiliation ? (
          <div className={row}>
            <span className={label}>所属</span>
            <span className={value}>
              <span className={affiliationBadge}>{profile.affiliation}</span>
            </span>
          </div>
        ) : null}
      </div>

      {profile.bio ? (
        <p
          className={css({
            mt: "3",
            mb: "0",
            p: "3",
            bg: "surface.page",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "border.default",
            borderRadius: "input",
            color: "text.muted",
            fontSize: "sm",
            lineHeight: "1.65",
            textAlign: "left",
          })}
        >
          {profile.bio}
        </p>
      ) : null}

      {website !== null || sns !== null ? (
        <div
          className={css({
            display: "flex",
            justifyContent: "center",
            gap: "4.5",
            mt: "3",
            fontSize: "sm",
            flexWrap: "wrap",
          })}
        >
          {website !== null ? (
            <a href={website.toString()} target="_blank" rel="noreferrer" className={externalLink}>
              {website.hostname.replace(/^www\./, "")} ↗
            </a>
          ) : null}
          {sns !== null ? (
            <a href={sns.toString()} target="_blank" rel="noreferrer" className={externalLink}>
              SNSを見る ↗
            </a>
          ) : null}
        </div>
      ) : null}

      <Link
        href="/me/edit"
        className={cx(
          buttonRecipe({ variant: "ghost", size: "md" }),
          css({ display: "flex", mt: "3.5" }),
        )}
      >
        プロフィールを編集
      </Link>
    </section>
  );
}
