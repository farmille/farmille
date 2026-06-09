"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

// AgList 風 search bar (`/products` の `?q=` 用)。
// design-tokens v2: green-subtle icon avatar + radius-full input。
// Form submit で URL を /products?q=...&type_id=...&crop_id=... に更新し、
// SSR で backend /v1/products?q=... を叩く。debounce は v1 では入れない
// (フォーム submit / クリア相当のみ、UX は AgList の form 提出フローに合致)。

type Props = {
  /** URL から渡される初期値 (SSR) */
  initialQuery: string;
};

export function ProductsSearchBar({ initialQuery }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(initialQuery);

  function apply(nextQ: string) {
    const params = new URLSearchParams(searchParams.toString());
    const cleaned = nextQ.trim();
    if (cleaned) {
      params.set("q", cleaned);
      trackEvent({ name: "filter_apply", params: { filter_type: "search" } });
    } else {
      params.delete("q");
    }
    const qs = params.toString();
    startTransition(() => {
      // scroll: false — フィルタ適用でユーザーが見ていたグリッド位置を保持。
      // Material 3 + Nielsen Norman の「コンテキスト維持」原則。
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    apply(value);
  }

  function handleClear() {
    setValue("");
    apply("");
  }

  return (
    // Material 3 "Search bar" パターン:
    //   - focus state は container (form) 側に focus-within で適用、input 自身は ring なし。
    //     input の rectangular ring が rounded-full container と視覚的にケンカするのを回避。
    //   - input は left padding (px-3) を持ち caret breathing room を確保 (rounded-full
    //     の curve エッジに caret が点滅するのを防ぐ)。
    //   - container の border と shadow は focus-within で控えめに強調 (派手にしない、
    //     Material 3 elevation tier 1 相当)。
    <form
      role="search"
      aria-label="資材名を検索"
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border border-border bg-card pl-3 pr-2 py-2 transition-colors focus-within:border-[var(--green-primary)]"
      style={{
        borderRadius: "var(--radius-full)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center"
        style={{
          backgroundColor: "var(--green-subtle)",
          borderRadius: "var(--radius-full)",
        }}
        aria-hidden
      >
        <Search className="h-4 w-4 text-[var(--green-primary)]" />
      </span>
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="資材名・製造元から検索"
        aria-label="資材名・製造元"
        maxLength={100}
        className="flex-1 min-w-0 bg-transparent px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="検索キーワードをクリア"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-[var(--green-subtle)] hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
          style={{ borderRadius: "var(--radius-full)" }}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-primary)] focus-visible:ring-offset-2"
        style={{
          backgroundColor: "var(--green-primary)",
          color: "var(--text-on-green)",
          borderRadius: "var(--radius-full)",
          transition: "var(--transition-fast)",
        }}
      >
        {isPending ? "検索中…" : "検索"}
      </button>
    </form>
  );
}
