"use client";

import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { Suspense, useId, useState, type ReactNode } from "react";

import { Icon } from "@/components/Icon";
import { css } from "../../styled-system/css";
import { popupPositionerStyle, popupRecipe } from "./popup";

const trigger = css({
  w: "10",
  h: "10",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  p: "0",
  borderRadius: "pill",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  bg: "surface.card",
  color: "text.brand",
  cursor: "pointer",
  _hover: { bg: "primary.soft" },
  "&[aria-expanded=true]": { bg: "primary.soft" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "0.5",
  },
});

const panel = css(popupRecipe.raw({ motion: "scale" }), {
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
});

const item = css({
  display: "flex",
  alignItems: "center",
  minH: "10",
  px: "3",
  borderRadius: "button",
  borderWidth: "0",
  bg: "transparent",
  color: "text.default",
  fontFamily: "sans",
  fontSize: "md",
  fontWeight: "bold",
  lineHeight: "tight",
  textAlign: "left",
  textDecoration: "none",
  whiteSpace: "nowrap",
  cursor: "pointer",
  _highlighted: { bg: "primary.soft", color: "text.brandOnSoft" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "0.5",
  },
  "&[aria-current=page]": { bg: "primary.soft", color: "text.brandOnSoft" },
});

type AccountMenuLink = {
  kind: "link";
  href: string;
  label: string;
  myPage: boolean;
};

type AccountMenuLogout = {
  kind: "logout";
  label: string;
};

type AccountMenuEntry = AccountMenuLink | AccountMenuLogout;

const GUEST_ENTRIES = [
  { kind: "link", href: "/login", label: "ログイン", myPage: false },
  { kind: "link", href: "/signup/general", label: "新規会員登録", myPage: false },
] as const satisfies readonly AccountMenuEntry[];

export const MEMBER_ENTRIES = [
  { kind: "link", href: "/me", label: "マイページ", myPage: true },
  { kind: "link", href: "/account", label: "設定", myPage: false },
  { kind: "logout", label: "ログアウト" },
  { kind: "link", href: "/sellers?from=me", label: "企業会員登録を申請", myPage: false },
] as const satisfies readonly AccountMenuEntry[];

export function hasAuthSession(): boolean {
  return document.cookie.split("; ").some((part) => {
    const name = part.split("=")[0] ?? "";
    return /^sb-.+-auth-token(?:\.\d+)?$/.test(name);
  });
}

const personIcon = <Icon name="person" size="md" />;

type DesktopAccountMenuProps = {
  myPageCurrent: boolean;
  /**
   * サーバー側で会員と確かめた閲覧者。渡されたら cookie を読まずに会員の項目を出し、ボタンに本人の画像を出す。
   * 未指定のときは人型アイコンにし、開いた時点の cookie で項目を決める。
   */
  member?: { avatar: ReactNode };
};

export function DesktopAccountMenu({ myPageCurrent, member }: DesktopAccountMenuProps) {
  const [signedIn, setSignedIn] = useState(false);
  const logoutFormId = useId();
  const entries = member !== undefined || signedIn ? MEMBER_ENTRIES : GUEST_ENTRIES;

  return (
    <Menu.Root
      onOpenChange={(open) => {
        if (open) setSignedIn(hasAuthSession());
      }}
    >
      <Menu.Trigger className={trigger} aria-label="アカウント">
        <Suspense fallback={personIcon}>{member?.avatar ?? personIcon}</Suspense>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className={popupPositionerStyle}>
          <Menu.Popup aria-label="アカウント" className={panel}>
            {entries.map((entry) =>
              entry.kind === "logout" ? (
                <Menu.Item
                  key={entry.label}
                  nativeButton
                  closeOnClick={false}
                  render={<button type="submit" form={logoutFormId} />}
                  className={item}
                >
                  {entry.label}
                </Menu.Item>
              ) : (
                <Menu.LinkItem
                  key={entry.href}
                  closeOnClick
                  render={<Link href={entry.href} />}
                  className={item}
                  aria-current={entry.myPage && myPageCurrent ? "page" : undefined}
                >
                  {entry.label}
                </Menu.LinkItem>
              ),
            )}
            {/* 項目をフォームで包むと、キーボードで開いたとき先頭でなくログアウトが選ばれるので、form 属性で結ぶ */}
            <form id={logoutFormId} action="/logout" method="post" hidden />
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
