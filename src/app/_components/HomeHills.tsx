import { css, cva, cx } from "../../../styled-system/css";

/** 下がった奥の層が枠の下へはみ出して次の節に線を引かないよう、下端だけで切る。上は双葉のために開けておく。 */
const frame = css({
  position: "relative",
  w: "100%",
  h: "10",
  pointerEvents: "none",
  clipPath: "inset(-100% 0 0 0)",
  tab: { h: "16" },
  pc: { h: "24" },
});

/**
 * 層は色を敷いた面を稜線の形で切り抜いて描く。SVG の図形を引き伸ばすと粒子まで伸びるので、
 * 形だけを型（mask）として引き伸ばし、粒子は元の大きさで敷き詰める。
 */
const layer = css({
  position: "absolute",
  inset: "0",
  maskSize: "100% 100%",
  maskRepeat: "no-repeat",
});

/** 奥の層は、丘が画面に入ってくるあいだ手前より遅れて持ち上がる。 */
const backLayer = cva({
  base: {
    maskImage: "token(assets.hill.back)",
    layerStyle: "wash",
    _scrollTimeline: {
      _motionSafe: {
        animationName: "hill-rise",
        animationTimingFunction: "linear",
        animationFillMode: "both",
        animationTimeline: "view()",
        animationRange: "entry 0% cover 50%",
      },
    },
  },
  variants: {
    into: {
      paper: { bgColor: "primary.200", opacity: "0.85" },
      forest: { bgColor: "primary.700" },
    },
  },
});

/**
 * 手前の層は次の節の地と同じ面にする。紙の地には質感を重ねない。
 * 層は枠の下端より少し下まで伸ばす。下端が画素の途中で終わると、下へ動いた奥の層がその1画素だけ線になって透ける。
 * 深い緑の丘は次の節の上端に 1px 重ねて置く前提で、質感の継ぎ目をその上端にそろえ、節の地と一続きに見せる。
 */
const frontLayer = cva({
  base: { bottom: "-0.5", maskImage: "token(assets.hill.front)" },
  variants: {
    into: {
      paper: { bgColor: "surface.paper" },
      forest: {
        bgColor: "surface.forest",
        layerStyle: "wash",
        bgPosition: "0 calc(100% - 1px - token(spacing.0.5))",
      },
    },
  },
});

/** 双葉は手前の稜線の頂に立てる。位置は稜線の座標（幅 1440・高さ 160、tokens の hill）から割り出した割合。 */
const sprout = cva({
  base: {
    position: "absolute",
    w: "6",
    // 揺れの transform と重ならないよう、中心合わせは translate で持つ
    translate: "-50% 0",
    transformOrigin: "50% 100%",
    tab: { w: "8" },
    pc: { w: "10" },
    _motionSafe: { animation: "sproutSway" },
  },
  variants: {
    into: {
      paper: { fill: "primary.600", stroke: "primary.600" },
      forest: { fill: "primary.400", stroke: "primary.400" },
    },
    spot: {
      near: { left: "32.6%", bottom: "38.75%" },
      // 半周期ずらして、二つの双葉が揃って揺れないようにする
      far: {
        left: "87.6%",
        bottom: "47.5%",
        _motionSafe: { animationDelay: "calc(token(durations.sway) / -2)" },
      },
    },
  },
});

const stem = css({ fill: "none", strokeWidth: "2.5", strokeLinecap: "round" });

function Sprout({ into, spot }: { into: HillsInto; spot: "near" | "far" }) {
  return (
    <svg className={sprout({ into, spot })} viewBox="0 0 40 48">
      <path className={stem} d="M20 47C20 38 20 31 21 23" />
      <path d="M21 25C12 27 4 21 3 11C13 10 21 15 21 25Z" />
      <path d="M21 23C26 13 33 9 39 10C39 19 31 26 21 23Z" />
    </svg>
  );
}

export type HillsInto = "paper" | "forest";

/**
 * 節の境目に重ねる、重なった丘の稜線。手前の層は次の節の地の色で塗り、そのまま地へつなげる。
 * 置き場所（前の節の下端に重ねるなど）は呼び出し側で決める。
 */
export function HomeHills({
  into,
  sprouts = false,
  className,
}: {
  into: HillsInto;
  /** 稜線の頂に、風に揺れる双葉を立てる。 */
  sprouts?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden className={cx(frame, className)}>
      <div className={cx(layer, backLayer({ into }))} />
      <div className={cx(layer, frontLayer({ into }))} />
      {sprouts ? (
        <>
          <Sprout into={into} spot="near" />
          <Sprout into={into} spot="far" />
        </>
      ) : null}
    </div>
  );
}
