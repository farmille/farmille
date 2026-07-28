import Image, { type ImageProps } from "next/image";

function mustSkipOptimization(src: ImageProps["src"]): boolean {
  return typeof src === "string" && src.startsWith("https://placehold.co/");
}

/**
 * 通常は Next Image で最適化し、SVG を返す既存プレースホルダだけを素通しにする。
 * 本番画像の最適化を維持したまま、SVG の全体許可を避ける。
 */
export function OptimizedImage({ src, unoptimized, ...props }: ImageProps) {
  return (
    <Image {...props} src={src} unoptimized={unoptimized === true || mustSkipOptimization(src)} />
  );
}
