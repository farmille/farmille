"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type Props = {
  isReviewer: boolean;
  isMaker: boolean;
  isLoggedIn: boolean;
};

// モバイル (md 未満) 用のハンバーガー → ドロワー。
// header 内の主ナビ + role 別リンクをまとめて出す。
//   - 主ナビ: 資材 / 記事 / メーカー
//   - reviewer: プロフィール / 自分のレビュー / マイ資材
//   - maker:    自社プロフィール / 自社資材 / 新規資材登録
//   - 未ログイン: ログイン / 新規登録

const NAV_LINKS = [
  { href: "/products", label: "資材" },
  { href: "/articles", label: "記事" },
  { href: "/manufacturers", label: "メーカー" },
];

export function SiteHeaderMobileNav({
  isReviewer,
  isMaker,
  isLoggedIn,
}: Props) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "メニューを閉じる" : "メニューを開く"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-dark)] md:hidden"
        style={{ border: "1px solid var(--overlay-on-dark-strong)" }}
      >
        {open ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5" aria-hidden />
        )}
      </button>

      {open && (
        <>
          {/* バックドロップ */}
          <div
            aria-hidden
            onClick={close}
            className="fixed inset-0 top-16 z-40 bg-foreground/30 md:hidden"
          />
          {/* ドロワー */}
          <nav
            aria-label="モバイル メニュー"
            className="fixed inset-x-0 top-16 z-50 border-b border-border bg-card p-4 shadow-lg md:hidden"
          >
            <ul className="space-y-1">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={close}
                    className="block rounded px-3 py-2 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              {isReviewer && (
                <>
                  <li className="pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    マイページ
                  </li>
                  <li>
                    <Link
                      href="/me/profile"
                      onClick={close}
                      className="block rounded px-3 py-2 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      プロフィール
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/me/reviews"
                      onClick={close}
                      className="block rounded px-3 py-2 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      自分のレビュー
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/me/materials"
                      onClick={close}
                      className="block rounded px-3 py-2 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      マイ資材
                    </Link>
                  </li>
                </>
              )}
              {isMaker && (
                <>
                  <li className="pt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    メーカー機能
                  </li>
                  <li>
                    <Link
                      href="/maker/profile"
                      onClick={close}
                      className="block rounded px-3 py-2 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      自社プロフィール
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/maker/products"
                      onClick={close}
                      className="block rounded px-3 py-2 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      自社資材
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products/new"
                      onClick={close}
                      className="block rounded px-3 py-2 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      新規資材登録
                    </Link>
                  </li>
                </>
              )}
              {!isLoggedIn && (
                <>
                  <li className="pt-2">
                    <Link
                      href="/login"
                      onClick={close}
                      className="block rounded px-3 py-2 text-base text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      ログイン
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup"
                      onClick={close}
                      className="block rounded bg-primary px-3 py-2 text-center text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                      新規登録
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
