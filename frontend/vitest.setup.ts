// Phase 19 vitest setup: load testing-library matchers globally.
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { vi } from "vitest";

// next/navigation の Server-Components 用 hooks を vitest (happy-dom) では
// router context が無く呼べないので、テスト全体で stub する。
// 個別テストで上書きしたい場合は ``vi.mocked(usePathname).mockReturnValue(...)``。
vi.mock("next/navigation", () => {
  return {
    usePathname: () => "/",
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    redirect: (url: string) => {
      throw new Error(`redirect:${url}`);
    },
  };
});

// next/image の SSR モックは不要だが、テスト時は素の <img> に置き換える
// (Next.js の image optimization loader を持ち込まないため)。
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const {
      src,
      alt,
      // 以下は <img> に流すと React warning が出るので外す
      fill: _fill,
      priority: _priority,
      placeholder: _placeholder,
      blurDataURL: _blurDataURL,
      unoptimized: _unoptimized,
      sizes: _sizes,
      loader: _loader,
      ...rest
    } = props as Record<string, unknown>;
    return React.createElement("img", {
      src: typeof src === "string" ? src : "",
      alt: typeof alt === "string" ? alt : "",
      ...rest,
    });
  },
}));

// next/link は <a> に降ろす (prefetch 等を無視)
vi.mock("next/link", () => ({
  default: (
    props: { href: string; children: React.ReactNode } & Record<
      string,
      unknown
    >,
  ) => {
    const { href, children, ...rest } = props;
    return React.createElement(
      "a",
      { href, ...rest },
      children as React.ReactNode,
    );
  },
}));
