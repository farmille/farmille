import humation1 from "@humation/assets-humation-1";
import { Avatar as HumationAvatar } from "@humation/react";

import { css, cva, type RecipeVariantProps } from "../../styled-system/css";

import { OptimizedImage as Image } from "./OptimizedImage";

const avatarRecipe = cva({
  base: {
    display: "inline-grid",
    placeItems: "center",
    flex: "none",
    overflow: "hidden",
    borderRadius: "pill",
    borderWidth: "1px",
    borderColor: "primary.700/22",
    bg: "primary.100",
  },
  variants: {
    size: {
      "2xs": { w: "4.5", h: "4.5" },
      xs: { w: "6.5", h: "6.5" },
      sm: { w: "8", h: "8" },
      md: { w: "9", h: "9" },
      xl: { w: "20", h: "20" },
      "2xl": { w: "28", h: "28" },
    },
  },
  defaultVariants: { size: "md" },
});

type AvatarSize = NonNullable<NonNullable<RecipeVariantProps<typeof avatarRecipe>>["size"]>;

const AVATAR_PIXELS = { "2xs": 18, xs: 26, sm: 32, md: 36, xl: 80, "2xl": 112 } satisfies Record<
  AvatarSize,
  number
>;

const mediaStyle = css({ display: "block", w: "full", h: "full", objectFit: "cover" });

export type AvatarProps = {
  /** ハンドル名などの表示名。画像が無いとき、どのイラストにするかの種になる。 */
  name: string;
  /** 設定された画像。無ければ表示名から決まるイラストを出す。 */
  src?: string | null;
  size?: AvatarSize;
};

/** 横に表示名を添える前提の装飾なので、支援技術には読み上げさせない。 */
export function Avatar({ name, src, size = "md" }: AvatarProps) {
  const pixels = AVATAR_PIXELS[size];

  return (
    <span className={avatarRecipe({ size })} aria-hidden="true">
      {src ? (
        <Image
          alt=""
          src={src}
          width={pixels}
          height={pixels}
          sizes={`${pixels}px`}
          className={mediaStyle}
        />
      ) : (
        <HumationAvatar
          assets={humation1}
          seed={name}
          background="transparent"
          size={pixels}
          className={mediaStyle}
        />
      )}
    </span>
  );
}
