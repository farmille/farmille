"use client";

import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { useId, useState } from "react";

import { Icon } from "@/components/Icon";
import { css } from "../../styled-system/css";
import { popupPositionerStyle, popupRecipe } from "./popup";

const trigger = css({
  w: "{spacing.10}",
  h: "{spacing.10}",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  p: "0",
  borderRadius: "pill",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  bg: "surface.card",
  color: "primary.700",
  cursor: "pointer",
  _hover: { bg: "primary.soft" },
  "&[aria-expanded=true]": { bg: "primary.soft" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "2px",
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
  minH: "{spacing.10}",
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
  _highlighted: { bg: "primary.soft", color: "primary.700" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "2px",
  },
  "&[aria-current=page]": { bg: "primary.soft", color: "primary.700" },
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

const MEMBER_ENTRIES = [
  { kind: "link", href: "/me", label: "マイページ", myPage: true },
  { kind: "link", href: "/account/passkeys", label: "パスキーを管理", myPage: false },
  { kind: "link", href: "/account/password", label: "パスワードを変更", myPage: false },
  { kind: "logout", label: "ログアウト" },
  { kind: "link", href: "/sellers?from=me", label: "企業会員登録を申請", myPage: false },
] as const satisfies readonly AccountMenuEntry[];

function hasAuthSession(): boolean {
  return document.cookie.split("; ").some((part) => {
    const name = part.split("=")[0] ?? "";
    return /^sb-.+-auth-token(?:\.\d+)?$/.test(name);
  });
}

export function DesktopAccountMenu({ myPageCurrent }: { myPageCurrent: boolean }) {
  const [signedIn, setSignedIn] = useState(false);
  const logoutFormId = useId();
  const entries = signedIn ? MEMBER_ENTRIES : GUEST_ENTRIES;

  return (
    <Menu.Root
      onOpenChange={(open) => {
        if (open) setSignedIn(hasAuthSession());
      }}
    >
      <Menu.Trigger className={trigger} aria-label="アカウント">
        <Icon name="person" size="md" />
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
