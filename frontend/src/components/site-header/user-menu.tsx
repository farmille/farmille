"use client";

import Link from "next/link";
import { ChevronDown, LogOut } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signOut } from "@/lib/auth/actions";

type Props = {
  displayName: string;
  initial: string;
  role: string | null;
  isReviewer: boolean;
  isMaker: boolean;
  /**
   * SiteHeader が dark 背景のときは trigger を透明 + 白枠に切り替える。
   * Popover content は常に白背景なのでそちらは不変。
   */
  onDarkHeader?: boolean;
};

// ログイン時のヘッダー右側。アバター (色付き円 + イニシャル) + プルダウンメニュー。
// menu の中身は role 別:
//   - reviewer: プロフィール / 自分のレビュー / マイ資材 / ログアウト
//   - maker:    自社プロフィール / 自社資材 / 新規資材登録 / ログアウト
//   - unassigned: オンボーディング / ログアウト

function MenuLink({
  href,
  label,
  onClose,
}: {
  href: string;
  label: string;
  onClose: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block w-full rounded px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted hover:text-primary"
        onClick={onClose}
      >
        {label}
      </Link>
    </li>
  );
}

export function SiteHeaderUserMenu({
  displayName,
  initial,
  role,
  isReviewer,
  isMaker,
  onDarkHeader = false,
}: Props) {
  // Popover の open 状態は Radix が制御する。menu リンクは router 遷移なので
  // 自前で close する必要があるが、Server Action の signOut は遷移を伴うため OK。
  // ここでは onClose を no-op に近い形で渡し、Link クリック後の Popover 自動閉じは
  // Radix のデフォルトに任せる (PopoverContent 内の click は伝搬で閉じる)。
  const close = () => {};

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`ユーザーメニュー (${displayName})`}
          className={
            onDarkHeader
              ? "inline-flex items-center gap-2 rounded-full border px-2 py-1 text-sm text-white transition-colors hover:bg-white/10"
              : "inline-flex items-center gap-2 rounded-full border border-border bg-background px-2 py-1 text-sm text-foreground transition-colors hover:border-primary hover:bg-muted"
          }
          style={
            onDarkHeader
              ? { borderColor: "rgba(255,255,255,0.25)" }
              : undefined
          }
        >
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          >
            {initial}
          </span>
          <span className="hidden max-w-[100px] truncate sm:inline-block">
            {displayName}
          </span>
          <ChevronDown
            className={
              onDarkHeader
                ? "h-4 w-4 text-white/80"
                : "h-4 w-4 text-muted-foreground"
            }
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-56 p-1">
        <div className="border-b border-border px-3 py-2">
          <p className="truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
          {role && (
            <p className="text-xs text-muted-foreground">role: {role}</p>
          )}
        </div>
        <ul className="py-1">
          {isReviewer && (
            <>
              <MenuLink
                href="/me/profile"
                label="プロフィール"
                onClose={close}
              />
              <MenuLink
                href="/me/reviews"
                label="自分のレビュー"
                onClose={close}
              />
              <MenuLink
                href="/me/materials"
                label="マイ資材"
                onClose={close}
              />
            </>
          )}
          {isMaker && (
            <>
              <MenuLink
                href="/maker/profile"
                label="自社プロフィール"
                onClose={close}
              />
              <MenuLink
                href="/maker/products"
                label="自社資材"
                onClose={close}
              />
              <MenuLink
                href="/products/new"
                label="新規資材登録"
                onClose={close}
              />
            </>
          )}
          {!isReviewer && !isMaker && (
            <MenuLink
              href="/onboarding"
              label="オンボーディングを完了する"
              onClose={close}
            />
          )}
        </ul>
        <div className="border-t border-border pt-1">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              ログアウト
            </button>
          </form>
        </div>
      </PopoverContent>
    </Popover>
  );
}
