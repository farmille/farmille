"use client";

import { useEffect, useRef, useState } from "react";

import { css } from "../../../styled-system/css";

/** 描き終わるまでは透明にし、最初の1枚が出たら浮かび上がらせる。写真の上の操作は妨げない。 */
const frame = css({
  w: "full",
  h: "full",
  pointerEvents: "none",
  opacity: "0",
  transitionProperty: "opacity",
  transitionDuration: "heroModel",
  transitionTimingFunction: "out",
  "&[data-ready]": { opacity: "1" },
});

const canvasStyle = css({ display: "block", w: "full", h: "full" });

/** WebGL2 が使えない端末では three.js を読み込まず、写真だけのヒーローのままにする。 */
function canUseWebgl2(): boolean {
  const context = document.createElement("canvas").getContext("webgl2");
  if (context === null) return false;
  context.getExtension("WEBGL_lose_context")?.loseContext();
  return true;
}

/**
 * ヒーローの写真に重ねて、BS 資材のボトルを回して見せる。飾りなので支援技術からは隠す。
 * three.js はホームの表示を待たせないよう、描画を始めるときに別チャンクで読み込む。
 */
export function HomeHeroModel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canUseWebgl2()) return;
    let unmount: (() => void) | null = null;
    let cancelled = false;
    void import("./bottle-scene").then(({ mountBottleScene }) => {
      if (cancelled) return;
      unmount = mountBottleScene(canvas, () => setReady(true));
    });
    return () => {
      cancelled = true;
      unmount?.();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-ui="home-hero-model"
      data-ready={ready ? "" : undefined}
      className={frame}
    >
      <canvas ref={canvasRef} className={canvasStyle} />
    </div>
  );
}
