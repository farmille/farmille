"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";

import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Icon } from "@/components/Icon";

import { css, cva } from "../../../../../../styled-system/css";

import { cropCanvas, redactCanvas, rotateCanvas, type Rect } from "./report-page-images";

import { useReportLeaveWarning } from "./use-report-leave-warning";

const stage = css({
  display: "flex",
  flexDirection: "column",
  minH: "[calc(100dvh - 3.5rem)]",
  bg: "scrim",
  color: "text.inverse",
});

const picture = css({
  flex: "1",
  minH: "0",
  display: "grid",
  placeItems: "center",
  p: "3.5",
});

const frame = css({ position: "relative", lineHeight: "none" });

const canvasStyle = css({
  display: "block",
  maxW: "[calc(100vw - 1.75rem)]",
  maxH: "[calc(100dvh - 15rem)]",
  bg: "surface.card",
});

const overlay = css({ position: "absolute", inset: "0", touchAction: "none" });

const boxRecipe = cva({
  base: {
    position: "absolute",
    left: "var(--box-x)",
    top: "var(--box-y)",
    w: "var(--box-w)",
    h: "var(--box-h)",
  },
  variants: {
    kind: {
      crop: {
        borderWidth: "2px",
        borderStyle: "solid",
        borderColor: "surface.card",
        boxShadow: "[0 0 0 9999px rgba(0, 0, 0, 0.55)]",
        cursor: "move",
      },
      redact: {
        bg: "scrim/85",
        borderWidth: "1px",
        borderStyle: "dashed",
        borderColor: "surface.card",
      },
    },
  },
});

const clip = css({ position: "absolute", inset: "0", overflow: "hidden" });

const handle = css({
  position: "absolute",
  left: "var(--box-x)",
  top: "var(--box-y)",
  w: "6.5",
  h: "6.5",
  ml: "-3",
  mt: "-3",
  borderRadius: "pill",
  bg: "surface.card",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "primary.600",
});

const hint = css({ px: "4", pb: "1.5", textStyle: "supporting", textAlign: "center" });

const tools = css({
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "2",
  px: "3",
  pt: "2",
  pb: "[calc(0.75rem + env(safe-area-inset-bottom, 0px))]",
});

const toolRecipe = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: "1",
    minW: "16",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "button",
    px: "3",
    py: "2",
    fontSize: "sm",
    fontWeight: "bold",
    cursor: "pointer",
    _disabled: { opacity: "disabled", cursor: "not-allowed" },
  },
  variants: {
    tone: {
      plain: { bg: "scrim", borderColor: "border.strong", color: "text.inverse" },
      primary: { bg: "primary.700", borderColor: "primary.700", color: "text.inverse" },
    },
  },
  defaultVariants: { tone: "plain" },
});

const done = css({ px: "4", pt: "2", display: "flex", justifyContent: "flex-end" });

type Mode = "" | "crop" | "redact";
type Drag =
  | { kind: "new"; from: Point }
  | { kind: "move"; dx: number; dy: number }
  | { kind: "corner"; fixed: Point }
  | { kind: "redact"; from: Point; rect: Rect | null };
type Point = { x: number; y: number };

function rectBetween(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

/** 画像の幅・高さに対する割合（%）。 */
function pct(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

/**
 * 差し込んだ画像の編集：回転・切り取り・塗りつぶし。操作のたびに新しい画像を作り、「元に戻す」で1つ前へ戻る。
 * original は差し込んだときの画像、current は今までの編集の結果。
 */
export function ReportImageEditor({
  open,
  original,
  current,
  onDone,
  onCancel,
}: {
  open: boolean;
  original: HTMLCanvasElement | null;
  current: HTMLCanvasElement | null;
  onDone: (canvas: HTMLCanvasElement) => void;
  onCancel: () => void;
}) {
  // 開くたびに呼び出し側が作り直す（key）ので、最初の状態は開いたときの画像
  const [stack, setStack] = useState<HTMLCanvasElement[]>(() =>
    current === null ? [] : [current],
  );
  const [mode, setMode] = useState<Mode>("");
  const [crop, setCrop] = useState<Rect | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const view = useRef<HTMLCanvasElement>(null);
  const top = stack.at(-1) ?? null;

  useReportLeaveWarning(open && (top !== current || crop !== null || drag !== null));

  // ポップアップの中身は後から描かれるので、canvas が置かれた時と画像が変わった時の両方で描く
  const drawTo = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      view.current = canvas;
      if (canvas === null || top === null) return;
      canvas.width = top.width;
      canvas.height = top.height;
      canvas.getContext("2d")?.drawImage(top, 0, 0);
    },
    [top],
  );

  function push(next: HTMLCanvasElement) {
    setStack((previous) => [...previous, next]);
  }
  function pointOf(event: PointerEvent<HTMLDivElement>): Point {
    const canvas = view.current;
    if (canvas === null || top === null) return { x: 0, y: 0 };
    const box = canvas.getBoundingClientRect();
    return {
      x: Math.min(top.width, Math.max(0, ((event.clientX - box.left) * top.width) / box.width)),
      y: Math.min(top.height, Math.max(0, ((event.clientY - box.top) * top.height) / box.height)),
    };
  }
  function startCrop() {
    if (top === null) return;
    setMode("crop");
    setCrop({ x: top.width * 0.05, y: top.height * 0.05, w: top.width * 0.9, h: top.height * 0.9 });
  }
  function onDown(event: PointerEvent<HTMLDivElement>) {
    if (mode === "") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointOf(event);
    if (mode === "redact") {
      setDrag({ kind: "redact", from: point, rect: null });
      return;
    }
    if (crop === null) return;
    const corner = event.target instanceof HTMLElement ? event.target.dataset.corner : undefined;
    if (corner !== undefined)
      setDrag({
        kind: "corner",
        fixed: {
          x: corner.includes("w") ? crop.x + crop.w : crop.x,
          y: corner.includes("n") ? crop.y + crop.h : crop.y,
        },
      });
    else if (event.target instanceof HTMLElement && event.target.dataset.move !== undefined)
      setDrag({ kind: "move", dx: point.x - crop.x, dy: point.y - crop.y });
    else setDrag({ kind: "new", from: point });
  }
  function onMove(event: PointerEvent<HTMLDivElement>) {
    if (drag === null || top === null) return;
    const point = pointOf(event);
    if (drag.kind === "redact") setDrag({ ...drag, rect: rectBetween(drag.from, point) });
    else if (drag.kind === "move" && crop !== null)
      setCrop({
        ...crop,
        x: Math.min(top.width - crop.w, Math.max(0, point.x - drag.dx)),
        y: Math.min(top.height - crop.h, Math.max(0, point.y - drag.dy)),
      });
    else if (drag.kind === "corner") setCrop(rectBetween(drag.fixed, point));
    else if (drag.kind === "new") setCrop(rectBetween(drag.from, point));
  }
  function onUp() {
    if (drag === null || top === null) return;
    setDrag(null);
    if (drag.kind === "redact") {
      if (drag.rect !== null && drag.rect.w > 6 && drag.rect.h > 6)
        push(redactCanvas(top, drag.rect));
      return;
    }
    if (crop !== null && (crop.w < 20 || crop.h < 20))
      setCrop({
        x: top.width * 0.05,
        y: top.height * 0.05,
        w: top.width * 0.9,
        h: top.height * 0.9,
      });
  }

  const message =
    mode === "crop"
      ? "枠の角を動かすか、枠の外をなぞって、残す範囲を決めます"
      : mode === "redact"
        ? "隠したい所を斜めになぞって四角く囲みます。何か所でも塗れます"
        : "画像の向きを直し、必要な部分だけを残します。氏名や住所は塗りつぶしで隠します";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      size="fullscreen"
      title="画像の編集"
      closeLabel="キャンセル"
    >
      <div className={stage}>
        <div className={done}>
          <Button
            variant="primary"
            size="sm"
            disabled={top === null}
            onClick={() => {
              if (top !== null) onDone(top);
            }}
          >
            完了
          </Button>
        </div>
        <div className={picture}>
          <div className={frame}>
            <canvas ref={drawTo} className={canvasStyle} aria-label="編集中の画像" role="img" />
            <div
              className={overlay}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              {top !== null && mode === "crop" && crop !== null && (
                <>
                  <div className={clip}>
                    <div
                      data-move
                      className={boxRecipe({ kind: "crop" })}
                      style={{
                        "--box-x": pct(crop.x, top.width),
                        "--box-y": pct(crop.y, top.height),
                        "--box-w": pct(crop.w, top.width),
                        "--box-h": pct(crop.h, top.height),
                      }}
                    />
                  </div>
                  {(
                    [
                      ["nw", crop.x, crop.y],
                      ["ne", crop.x + crop.w, crop.y],
                      ["sw", crop.x, crop.y + crop.h],
                      ["se", crop.x + crop.w, crop.y + crop.h],
                    ] as const
                  ).map(([corner, x, y]) => (
                    <div
                      key={corner}
                      data-corner={corner}
                      className={handle}
                      style={{ "--box-x": pct(x, top.width), "--box-y": pct(y, top.height) }}
                    />
                  ))}
                </>
              )}
              {top !== null && drag?.kind === "redact" && drag.rect !== null && (
                <div
                  className={boxRecipe({ kind: "redact" })}
                  style={{
                    "--box-x": pct(drag.rect.x, top.width),
                    "--box-y": pct(drag.rect.y, top.height),
                    "--box-w": pct(drag.rect.w, top.width),
                    "--box-h": pct(drag.rect.h, top.height),
                  }}
                />
              )}
            </div>
          </div>
        </div>
        <p className={hint}>{message}</p>
        <div className={tools}>
          {mode === "" && (
            <>
              <button
                type="button"
                className={toolRecipe()}
                onClick={() => top && push(rotateCanvas(top, -1))}
              >
                <Icon name="rotate_left" size="sm" />
                左に回転
              </button>
              <button
                type="button"
                className={toolRecipe()}
                onClick={() => top && push(rotateCanvas(top, 1))}
              >
                <Icon name="rotate_right" size="sm" />
                右に回転
              </button>
              <button type="button" className={toolRecipe()} onClick={startCrop}>
                <Icon name="crop" size="sm" />
                切り取り
              </button>
              <button type="button" className={toolRecipe()} onClick={() => setMode("redact")}>
                <Icon name="format_color_fill" size="sm" />
                塗りつぶし
              </button>
            </>
          )}
          {mode === "crop" && (
            <>
              <button type="button" className={toolRecipe()} onClick={() => setMode("")}>
                やめる
              </button>
              <button
                type="button"
                className={toolRecipe({ tone: "primary" })}
                onClick={() => {
                  if (top !== null && crop !== null) push(cropCanvas(top, crop));
                  setMode("");
                }}
              >
                この範囲で切り取る
              </button>
            </>
          )}
          {mode !== "crop" && (
            <button
              type="button"
              className={toolRecipe()}
              disabled={stack.length < 2}
              onClick={() => setStack((previous) => previous.slice(0, -1))}
            >
              <Icon name="undo" size="sm" />
              元に戻す
            </button>
          )}
          {mode === "" && (
            <button
              type="button"
              className={toolRecipe()}
              disabled={original === null || top === original}
              onClick={() => original && push(original)}
            >
              最初の画像に戻す
            </button>
          )}
          {mode === "redact" && (
            <button
              type="button"
              className={toolRecipe({ tone: "primary" })}
              onClick={() => setMode("")}
            >
              塗りつぶしを終える
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
