import Link from "next/link";

import { buttonRecipe } from "@/components";
import { Icon } from "@/components/Icon";
import { OptimizedImage as Image } from "@/components/OptimizedImage";
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
  bg: "primary.soft",
  color: "primary.700",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
});

type ProfileCardProps = {
  profile: OwnProfile;
};

/** マイページに、投稿者として公開される最小限の表示情報を示す。 */
export function ProfileCard({ profile }: ProfileCardProps) {
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
          <Icon name="person" size="2xl" />
        )}
      </div>
      <h1 id="me-handle" className={css({ mt: "2.5", mb: "0", fontSize: "xl", fontWeight: "800" })}>
        {profile.handle}
      </h1>

      <Link
        href="/me/edit"
        className={cx(
          buttonRecipe({ variant: "ghost", size: "md" }),
          css({ display: "flex", mt: "3.5" }),
        )}
      >
        表示情報を編集
      </Link>
    </section>
  );
}
