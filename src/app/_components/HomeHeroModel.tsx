"use client";

import { useEffect, useRef, useState } from "react";

import { css } from "../../../styled-system/css";

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

function canUseWebgl2(): boolean {
  const context = document.createElement("canvas").getContext("webgl2");
  if (context === null) return false;
  context.getExtension("WEBGL_lose_context")?.loseContext();
  return true;
}

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
