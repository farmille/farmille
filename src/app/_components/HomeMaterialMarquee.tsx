"use client";

import { type ReactNode } from "react";
import { useHomeMaterialMarquee } from "@/lib/hooks/use-home-material-marquee";

import { css, cva, cx } from "../../../styled-system/css";

const frame = cva({
  base: { pb: "4" },
  variants: {
    mode: {
      marquee: {
        // clip はスクロール可能領域を作らないので、フォーカス移動でブラウザが
        // スクロール位置を動かして transform とズレることがない。
        overflowX: "clip",
        overflowY: "visible",
        // ページコンテナの左右余白の分だけ画面端まで広げる。
        mx: "-4",
        tab: { mx: "-5" },
        // 両端のフェード。transparent と black はマスクのアルファ指定であり配色ではない。
        // 濃さは smoothstep（両端の傾きが 0 の S 字）で変え、端と内側の境目を線として見せない。
        maskImage:
          "linear-gradient(90deg, transparent 0%, rgb(0 0 0 / 0.043) 0.75%, rgb(0 0 0 / 0.156) 1.5%, rgb(0 0 0 / 0.316) 2.25%, rgb(0 0 0 / 0.500) 3%, rgb(0 0 0 / 0.684) 3.75%, rgb(0 0 0 / 0.844) 4.5%, rgb(0 0 0 / 0.957) 5.25%, black 6%, black 94%, rgb(0 0 0 / 0.957) 94.75%, rgb(0 0 0 / 0.844) 95.5%, rgb(0 0 0 / 0.684) 96.25%, rgb(0 0 0 / 0.500) 97%, rgb(0 0 0 / 0.316) 97.75%, rgb(0 0 0 / 0.156) 98.5%, rgb(0 0 0 / 0.043) 99.25%, transparent 100%)",
        cursor: "grab",
        // 縦スクロールはブラウザに任せ、横方向のドラッグだけ受け取る。
        touchAction: "pan-y",
        userSelect: "none",
        // JS が動く前の SSR HTML でも静止させる。
        "@media (prefers-reduced-motion: reduce)": {
          overflowX: "auto",
          mx: "0",
          maskImage: "none",
          cursor: "auto",
          scrollSnapType: "[x mandatory]",
          touchAction: "auto",
          userSelect: "auto",
        },
      },
      static: {
        overflowX: "auto",
        scrollSnapType: "[x mandatory]",
      },
    },
  },
});

const track = css({ display: "flex", w: "[max-content]", willChange: "transform" });

/** 末尾の余白をカード間の gap と揃えると、-50% の折り返しが2セット目の先頭に一致する。 */
const cardSet = css({ display: "flex", gap: "3", pr: "3" });

const cloneSet = css({
  "@media (prefers-reduced-motion: reduce)": { display: "none" },
});

/**
 * 掲載資材の横並びを左へ流し続ける。
 * カーソルを乗せると滑らかに減速し、ホイール・ドラッグ・キーボードフォーカスで位置を動かせる。
 * 視覚過敏の設定・アニメーション非対応・カードが画面内に収まる場合は手動スクロールに落とす。
 */
export function HomeMaterialMarquee({ children }: { children: ReactNode }) {
  const { frameRef, trackRef, setRef, mode } = useHomeMaterialMarquee();

  return (
    <div
      ref={frameRef}
      data-ui="home-material-marquee"
      data-mode={mode}
      className={frame({ mode })}
    >
      <div ref={trackRef} className={track}>
        <div ref={setRef} className={cardSet}>
          {children}
        </div>
        {mode === "marquee" ? (
          // ループ用の複製。支援技術とキーボードフォーカスから除外する。
          <div className={cx(cardSet, cloneSet)} aria-hidden="true" inert>
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
