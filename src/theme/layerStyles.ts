import { defineLayerStyles } from "@pandacss/dev";

/** 面の質感。色は持たず、呼び出し側で background-color を足す。 */
export const layerStyles = defineLayerStyles({
  wash: {
    description:
      "色の面に、水彩紙に絵の具を刷いたような濃淡を重ねる。background の一括指定は質感の画像を消すので、面の色は bgColor で指定する。",
    value: {
      backgroundImage: "wash",
      backgroundSize: "token(sizes.texture)",
      backgroundBlendMode: "soft-light",
    },
  },
});
