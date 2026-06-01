"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Pause, Play } from "lucide-react";

// Phase 18 / 2026-05-27 demo polish:
// 画像オンリーのフルブリード hero スライダー（前ラウンドの「記事カード横並び」を破棄）。
// spec docs/specs/home.md §6.1 / §6.3
//
// 構造:
//   1) 背景レイヤー: 70vh フル幅。images を fade で cross-fade（自動 5s）
//   2) グラデーション overlay: 下に向かって暗くなる。pointer-events-none
//   3) コンテンツ overlay: 大見出し + サブコピー + CTA 2 つ。画像と独立して静止
//   4) dots (>=2 枚時のみ): 下端 center。クリックで jump + timer reset
//
// 動作:
//   - 1 枚のみ: auto-advance なし、dots 非表示
//   - hover: タイマー pause（leave で再開）
//   - keyboard: ← → で prev/next（focus 不要、root の onKeyDown）

const AUTO_ADVANCE_MS = 5000;

export type HeroSliderImage = {
  url: string;
  alt: string;
};

// prefers-reduced-motion を SSR 安全に購読 (WCAG 2.3.3)。
// useSyncExternalStore: server snapshot=false で hydration mismatch を避けつつ、
// client では実際のメディア状態を読み、変更にも追従する。
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(REDUCED_MOTION_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export function HeroSlider({
  images,
  title,
  subtitle,
}: {
  images: HeroSliderImage[];
  title: string;
  subtitle: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // paused: hover/focus による一時停止 (離れると解除)
  // manuallyPaused: Pause ボタンによる明示停止 (WCAG 2.2.2 — autoplay の停止手段)
  const [paused, setPaused] = useState(false);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasImages = images.length > 0;
  const multipleImages = images.length > 1;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    // hover/focus・明示停止・reduced-motion のいずれでも自動送りを止める
    if (!multipleImages || paused || manuallyPaused || reducedMotion) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, AUTO_ADVANCE_MS);
  }, [
    clearTimer,
    multipleImages,
    paused,
    manuallyPaused,
    reducedMotion,
    images.length,
  ]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [startTimer, clearTimer]);

  const jumpTo = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      // 明示操作の直後は timer を reset して、次の 5s 区間を頭から取り直す
      startTimer();
    },
    [startTimer],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!multipleImages) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        jumpTo((currentIndex + 1) % images.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        jumpTo((currentIndex - 1 + images.length) % images.length);
      }
    },
    [currentIndex, images.length, jumpTo, multipleImages],
  );

  return (
    <section
      aria-label="Farmille のご紹介"
      className="relative w-full overflow-hidden"
      style={{ height: "35vh", minHeight: "260px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* 背景レイヤー: 画像 cross-fade（safety net 含む） */}
      <div className="absolute inset-0">
        {hasImages ? (
          images.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              aria-hidden={index !== currentIndex}
              className={`absolute inset-0 transition-opacity ease-in-out ${
                reducedMotion ? "duration-0" : "duration-1000"
              } ${index === currentIndex ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes="100vw"
                priority={index === 0}
                className="object-cover"
              />
            </div>
          ))
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--green-primary) 0%, var(--green-dark) 100%)",
            }}
          />
        )}
      </div>

      {/* グラデーション overlay: 文字視認性確保 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* コンテンツ overlay: 静止 */}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div className="max-w-3xl text-center space-y-6">
          <h1
            className="text-4xl sm:text-6xl font-semibold tracking-tight text-white leading-tight"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}
          >
            {title}
          </h1>
          <p
            className="text-lg sm:text-xl text-white/95 leading-relaxed max-w-2xl mx-auto"
            style={{ textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}
          >
            {subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild size="lg">
              <Link href="/products">
                資材を見る
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Link
              href="/articles"
              className="inline-flex items-center justify-center gap-2 h-12 px-8 rounded text-base font-medium border border-white/80 bg-transparent text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              記事を見る
            </Link>
          </div>
        </div>
      </div>

      {/* dots + pause/play: >=2 枚時のみ。
          role=tab/tablist は tabpanel を伴わず ARIA 違反だったので plain button に降格。 */}
      {multipleImages ? (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-3">
          {/* reduced-motion 時は自動送りしないので Pause ボタンは出さない */}
          {!reducedMotion ? (
            <button
              type="button"
              onClick={() => setManuallyPaused((p) => !p)}
              aria-label={
                manuallyPaused
                  ? "スライドショーを再生"
                  : "スライドショーを一時停止"
              }
              className="grid h-6 w-6 place-items-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              {manuallyPaused ? (
                <Play className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Pause className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
          ) : null}
          <div className="flex justify-center gap-2">
            {images.map((_, index) => {
              const active = index === currentIndex;
              return (
                <button
                  key={index}
                  type="button"
                  aria-label={`${index + 1} 番目の画像へ`}
                  aria-current={active ? "true" : undefined}
                  onClick={() => jumpTo(index)}
                  className="rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  style={{
                    width: active ? "0.75rem" : "0.5rem",
                    height: active ? "0.75rem" : "0.5rem",
                    backgroundColor: active
                      ? "var(--green-primary)"
                      : "rgba(255,255,255,0.5)",
                  }}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
