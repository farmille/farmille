import Image, { type StaticImageData } from "next/image";

import { css, cva } from "../../../styled-system/css";
import { Reveal } from "./Reveal";

const frame = cva({
  base: { position: "relative", overflow: "hidden", bg: "primary.100" },
  variants: {
    ratio: {
      portrait: { aspectRatio: "image.portrait" },
      landscape: { aspectRatio: "image.landscape" },
      square: { aspectRatio: "image.square" },
    },
  },
});

/** 写真は枠より上下に大きく描き、スクロールに合わせて枠の中でずらす。 */
const drift = css({
  position: "absolute",
  top: "[-8%]",
  right: "0",
  bottom: "[-8%]",
  left: "0",
  _scrollTimeline: {
    _motionSafe: {
      animationName: "parallax-drift",
      animationTimingFunction: "[linear]",
      animationFillMode: "both",
      animationTimeline: "view()",
      animationRange: "cover",
    },
  },
});

/** 枠が浮かび上がるあいだ、写真は少し寄った位置から引く。 */
const photo = css({
  objectFit: "cover",
  transitionProperty: "[transform]",
  transitionDuration: "reveal",
  transitionTimingFunction: "out",
  _scripted: { _motionSafe: { transform: "scale(1.12)" } },
  _revealedWithin: { transform: "scale(1)" },
});

type HomePhotoProps = {
  src: StaticImageData;
  alt: string;
  ratio: "portrait" | "landscape" | "square";
  /** next/image の sizes。並べ方で表示幅が変わるので呼び出し側で決める。 */
  sizes: string;
  delay?: "0" | "1" | "2";
  className?: string;
};

/** ホームの写真。画面に入ると枠が浮かび上がり、スクロールに合わせて中の写真がずれる。 */
export function HomePhoto({ src, alt, ratio, sizes, delay, className }: HomePhotoProps) {
  return (
    <Reveal className={className} delay={delay}>
      <div className={frame({ ratio })}>
        <div className={drift}>
          <Image alt={alt} className={photo} fill placeholder="blur" sizes={sizes} src={src} />
        </div>
      </div>
    </Reveal>
  );
}
