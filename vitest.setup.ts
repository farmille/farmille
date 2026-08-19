// Phase 18 vitest setup: jest-dom matchers + Next.js stubs for happy-dom.
import "@testing-library/jest-dom/vitest";
import * as React from "react";
import { vi } from "vitest";

// next/image を素の <img> に降ろす (happy-dom 環境で next/image の loader を持ち込まない)
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const {
      src,
      alt,
      // <img> に流すと React warning を起こす props を取り除く
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

// next/link は <a> に降ろす
vi.mock("next/link", () => ({
  default: (props: { href: string; children: React.ReactNode } & Record<string, unknown>) => {
    const { href, children, ...rest } = props;
    return React.createElement("a", { href, ...rest }, children as React.ReactNode);
  },
}));

// next/navigation の Server hooks を stub (happy-dom には router context が無い)
vi.mock("next/navigation", () => ({
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
}));
