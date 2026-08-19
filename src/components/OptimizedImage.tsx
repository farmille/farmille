"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cva, cx } from "../../styled-system/css";

const DIRECT_IMAGE_HOSTS = new Set([
  "placehold.co",
  "multisite-assets.icl-growingsolutions.com",
  "d2bu5vyg1irlw4.cloudfront.net",
  "www.aichi-steel.co.jp",
]);

const imageVisibility = cva({
  base: { opacity: "0" },
  variants: {
    loaded: {
      true: { opacity: "1" },
    },
  },
});

function sourceKey(src: ImageProps["src"]): string {
  if (typeof src === "string") return src;
  return "src" in src ? src.src : src.default.src;
}

function mustSkipOptimization(src: ImageProps["src"]): boolean {
  if (typeof src !== "string" || !src.startsWith("https://")) return false;

  return DIRECT_IMAGE_HOSTS.has(new URL(src).hostname);
}

/**
 * Supabase Storage 等は Next Image で最適化し、取得制限のある外部画像だけを素通しにする。
 * 読み込みに失敗した画像は外し、親要素側のプレースホルダーを表示する。
 */
export function OptimizedImage({
  src,
  className,
  unoptimized,
  onError,
  onLoad,
  ...props
}: ImageProps) {
  const key = sourceKey(src);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const [loadedSource, setLoadedSource] = useState<string | null>(null);

  if (failedSource === key) return null;

  return (
    <Image
      {...props}
      src={src}
      className={cx(className, imageVisibility({ loaded: loadedSource === key }))}
      unoptimized={unoptimized === true || mustSkipOptimization(src)}
      onLoad={(event) => {
        setLoadedSource(key);
        onLoad?.(event);
      }}
      onError={(event) => {
        setFailedSource(key);
        onError?.(event);
      }}
    />
  );
}
