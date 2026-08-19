"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import * as v from "valibot";
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
  const textResult = v.safeParse(v.string(), src);
  if (textResult.success) return textResult.output;

  const directResult = v.safeParse(v.object({ src: v.string() }), src);
  if (directResult.success) return directResult.output.src;

  const requiredResult = v.safeParse(v.object({ default: v.object({ src: v.string() }) }), src);
  if (requiredResult.success) return requiredResult.output.default.src;

  throw new Error("画像ソースの形式が不正です。");
}

function mustSkipOptimization(src: ImageProps["src"]): boolean {
  const result = v.safeParse(v.string(), src);
  if (!result.success || !result.output.startsWith("https://")) return false;

  return DIRECT_IMAGE_HOSTS.has(new URL(result.output).hostname);
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
