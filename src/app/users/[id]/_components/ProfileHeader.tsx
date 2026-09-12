import { PersonIcon } from "@/components/Icons";
import { STANDPOINTS } from "@/lib/standpoints";
import { PREFECTURES } from "@/lib/prefectures";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
import type { PublicProfilePageData } from "@/server/queries/public-profiles";
import { css } from "../../../../../styled-system/css";

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

type ProfileHeaderProps = {
  profile: PublicProfilePageData["profile"];
};

/** 連絡先を含めず、公開プロフィールだけを表示する。 */
export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <section className={card} aria-labelledby="profile-handle">
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
      <h1
        id="profile-handle"
        className={css({ mt: "2.5", mb: "0", fontSize: "xl", fontWeight: "800" })}
      >
        {profile.handle}
      </h1>
      <p className={css({ color: "text.subtle", fontSize: "sm" })}>
        {[
          STANDPOINTS.find((item) => item.value === profile.standpoint)?.label,
          PREFECTURES.find((item) => item.code === profile.prefectureCode)?.name,
        ]
          .filter(Boolean)
          .join(" ・ ")}
      </p>
    </section>
  );
}
