import { css, cva, cx } from "../../../styled-system/css";

/** 縦書きの帯を右から読む順に並べ、左の帯ほど下げて階段状にする。 */
const row = css({
  display: "flex",
  flexDirection: "row-reverse",
  alignItems: "flex-start",
  gap: "2",
  m: "0",
  tab: { gap: "3" },
});

/**
 * 帯の地は疑似要素に描き、上から下へ伸ばす。文字は地が伸びきる前から浮かべる。
 * load は読み込み直後に、scroll は外側の Reveal が画面に入ったときに動かす。
 * 視覚効果を減らす設定では伸ばさず、そのまま見せる。
 */
const band = cva({
  base: {
    position: "relative",
    isolation: "isolate",
    display: "block",
    writingMode: "vertical-rl",
    // 帯は文字に沿わせる。縦書きでは inline が上下、block が左右に当たる
    paddingBlock: "1",
    paddingInline: "2",
    color: "text.inverse",
    textStyle: "hero",
    whiteSpace: "nowrap",
    tab: { paddingBlock: "1.5", paddingInline: "3" },
    _before: {
      content: '""',
      position: "absolute",
      inset: "0",
      zIndex: "[-1]",
      bgColor: "primary.700",
      layerStyle: "wash",
      transformOrigin: "top",
    },
  },
  variants: {
    motion: {
      load: { _motionSafe: { _before: { animation: "heroBand" } } },
      scroll: {
        _before: {
          transitionProperty: "[transform]",
          transitionDuration: "reveal",
          transitionTimingFunction: "out",
        },
        _scripted: { _motionSafe: { _before: { transform: "scaleY(0)" } } },
        _revealedWithin: { _before: { transform: "scaleY(1)" } },
      },
    },
    step: {
      first: {},
      second: { mt: "10", tab: { mt: "16" } },
      third: { mt: "20", tab: { mt: "32" } },
    },
  },
  compoundVariants: [
    // animation の一括指定が遅延を打ち消さないよう、遅延も同じ条件の中に置く
    {
      motion: "load",
      step: "first",
      css: { _motionSafe: { _before: { animationDelay: "intro" } } },
    },
    {
      motion: "load",
      step: "second",
      css: {
        _motionSafe: {
          _before: { animationDelay: "[calc({durations.intro} + {durations.revealStep})]" },
        },
      },
    },
    {
      motion: "load",
      step: "third",
      css: {
        _motionSafe: {
          _before: {
            animationDelay: "[calc({durations.intro} + {durations.revealStep} * 2)]",
          },
        },
      },
    },
    { motion: "scroll", step: "second", css: { _before: { transitionDelay: "revealStep" } } },
    {
      motion: "scroll",
      step: "third",
      css: { _before: { transitionDelay: "[calc({durations.revealStep} * 2)]" } },
    },
  ],
});

/** 文字は帯の地より intro ぶん遅れて浮かべる。 */
const bandText = cva({
  base: { display: "block" },
  variants: {
    motion: {
      load: { _motionSafe: { animation: "heroBandText" } },
      scroll: {
        transitionProperty: "[opacity]",
        transitionDuration: "reveal",
        transitionTimingFunction: "out",
        _scripted: { _motionSafe: { opacity: "0" } },
        _revealedWithin: { opacity: "1" },
      },
    },
    step: { first: {}, second: {}, third: {} },
  },
  compoundVariants: [
    {
      motion: "load",
      step: "first",
      css: { _motionSafe: { animationDelay: "[calc({durations.intro} * 2)]" } },
    },
    {
      motion: "load",
      step: "second",
      css: {
        _motionSafe: {
          animationDelay: "[calc({durations.intro} * 2 + {durations.revealStep})]",
        },
      },
    },
    {
      motion: "load",
      step: "third",
      css: {
        _motionSafe: {
          animationDelay: "[calc({durations.intro} * 2 + {durations.revealStep} * 2)]",
        },
      },
    },
    { motion: "scroll", step: "first", css: { transitionDelay: "intro" } },
    {
      motion: "scroll",
      step: "second",
      css: { transitionDelay: "[calc({durations.intro} + {durations.revealStep})]" },
    },
    {
      motion: "scroll",
      step: "third",
      css: {
        transitionDelay: "[calc({durations.intro} + {durations.revealStep} * 2)]",
      },
    },
  ],
});

const steps = ["first", "second", "third"] as const;

type HomeVerticalCopyProps = {
  /** 右の帯から読む順に3行。 */
  lines: readonly [string, string, string];
  as: "h1" | "p";
  motion: "load" | "scroll";
  id?: string;
  className?: string;
};

/** 写真の上に置く、緑の帯に白で組んだ縦書きの一文。 */
export function HomeVerticalCopy({ lines, as: Tag, motion, id, className }: HomeVerticalCopyProps) {
  return (
    <Tag className={cx(row, className)} id={id}>
      {lines.map((line, index) => (
        <span className={band({ motion, step: steps[index] })} key={line}>
          <span className={bandText({ motion, step: steps[index] })}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}
