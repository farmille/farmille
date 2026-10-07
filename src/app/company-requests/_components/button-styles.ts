import { css } from "../../../../styled-system/css";
import { buttonRecipe } from "@/components/Button";

/** .fm の本文書体のまま、共通ボタンの形で出すリンクとボタン。 */
export const pageButtonStyles = {
  primary: css(buttonRecipe.raw({ variant: "primary" }), { fontFamily: "inherit" }),
  ghost: css(buttonRecipe.raw({ variant: "ghost" }), { fontFamily: "inherit" }),
  ghostSmall: css(buttonRecipe.raw({ variant: "ghost", size: "sm" }), { fontFamily: "inherit" }),
};
