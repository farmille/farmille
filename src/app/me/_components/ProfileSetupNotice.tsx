import { Icon } from "@/components/Icon";
import Link from "next/link";

import { buttonRecipe } from "@/components/Button";
import { Notice } from "@/components/form";
import { css } from "../../../../styled-system/css";

/** マイページだけに出す、未設定の項目の案内。1行で、全部そろったら出さない。 */
export type ProfileSetupNoticeProps = {
  /** プロフィール公開情報編集で入れられる項目のうち、空のもの。表示順は編集画面の並びに合わせる。 */
  missing: readonly ProfileSetupItem[];
};

export type ProfileSetupItem = "bio" | "crops" | "affiliations" | "links";

const ITEM_LABELS = {
  bio: "自己紹介",
  crops: "栽培作目",
  affiliations: "所属",
  links: "リンク",
} as const satisfies Record<ProfileSetupItem, string>;

const ITEM_ORDER: readonly ProfileSetupItem[] = ["bio", "crops", "affiliations", "links"];

const row = css({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "2",
  mt: "3",
});

const text = css({ flex: "none" });

// 未設定の項目は押せるボタンで並べる。押すとプロフィール公開情報編集へ。
const itemButton = css(buttonRecipe.raw({ variant: "ghost", size: "sm" }), {
  px: "3",
  py: "1.5",
  minW: "0",
  gap: "1",
  fontSize: "sm",
});

const plus = css({ color: "text.brand", fontWeight: "black", lineHeight: "none" });

export function missingProfileItems(details: {
  bio: string | null;
  crops: readonly unknown[];
  affiliations: readonly unknown[];
  links: readonly unknown[];
}): ProfileSetupItem[] {
  return ITEM_ORDER.filter((item) => {
    switch (item) {
      case "bio":
        return details.bio === null || details.bio.trim() === "";
      case "crops":
        return details.crops.length === 0;
      case "affiliations":
        return details.affiliations.length === 0;
      case "links":
        return details.links.length === 0;
    }
  });
}

export function ProfileSetupNotice({ missing }: ProfileSetupNoticeProps) {
  if (missing.length === 0) return null;

  return (
    <Notice tone="info" className={row}>
      <span className={text}>未設定の項目</span>
      {ITEM_ORDER.flatMap((item) =>
        missing.includes(item)
          ? [
              <Link className={itemButton} href="/me/edit" key={item}>
                <Icon name="add" size="xs" className={plus} />
                {ITEM_LABELS[item]}
              </Link>,
            ]
          : [],
      )}
    </Notice>
  );
}
