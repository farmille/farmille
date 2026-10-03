"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/Icon";
import { css } from "../../styled-system/css";

const root = css({
  position: "relative",
});

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
  _hover: { bg: "primary.200" },
  "&[aria-expanded=true]": { bg: "primary.200" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "2px",
  },
});

const panel = css({
  position: "absolute",
  top: "100%",
  right: "0",
  zIndex: "10",
  mt: "1.5",
  display: "flex",
  flexDirection: "column",
  gap: "0.5",
  p: "1.5",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
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
  fontWeight: "700",
  lineHeight: "tight",
  textAlign: "left",
  textDecoration: "none",
  whiteSpace: "nowrap",
  cursor: "pointer",
  _hover: { bg: "primary.200", color: "primary.700" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "2px",
  },
  "&[aria-current=page]": { bg: "primary.200", color: "primary.700" },
});

const logoutForm = css({
  display: "flex",
  flexDirection: "column",
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

type MenuDirection = "ArrowDown" | "ArrowUp";

function focusAdjacentMenuItem(menu: HTMLElement, key: MenuDirection): void {
  const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  const count = items.length;
  if (count === 0) return;

  const active = document.activeElement;
  const index = active instanceof HTMLElement ? items.indexOf(active) : -1;
  const nextIndex =
    index === -1
      ? key === "ArrowDown"
        ? 0
        : count - 1
      : key === "ArrowDown"
        ? (index + 1) % count
        : (index - 1 + count) % count;
  const next = items[nextIndex];
  if (next === undefined) return;
  next.focus();
}

function isMenuDirection(key: string): key is MenuDirection {
  return key === "ArrowDown" || key === "ArrowUp";
}

export function DesktopAccountMenu({ myPageCurrent }: { myPageCurrent: boolean }) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<MenuDirection | null>(null);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!open) return;

    const direction = pendingFocus.current;
    pendingFocus.current = null;
    if (direction !== null && menuRef.current !== null) {
      focusAdjacentMenuItem(menuRef.current, direction);
    }

    const closeIfOutside = (target: EventTarget | null) => {
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      closeIfOutside(event.target);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const openMenu = (direction: MenuDirection | null) => {
    setSignedIn(hasAuthSession());
    pendingFocus.current = direction;
    setOpen(true);
  };

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    openMenu(null);
  };

  const moveFocus = (key: MenuDirection) => {
    if (!open) {
      openMenu(key);
      return;
    }
    if (menuRef.current === null) return;
    focusAdjacentMenuItem(menuRef.current, key);
  };

  const entries = signedIn ? MEMBER_ENTRIES : GUEST_ENTRIES;

  return (
    <div ref={rootRef} className={root}>
      <button
        ref={triggerRef}
        type="button"
        className={trigger}
        aria-label="アカウント"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
        onKeyDown={(event) => {
          if (!isMenuDirection(event.key)) return;
          event.preventDefault();
          moveFocus(event.key);
        }}
      >
        <Icon name="person" size="md" />
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="アカウント"
          className={panel}
          onKeyDown={(event) => {
            if (!isMenuDirection(event.key)) return;
            event.preventDefault();
            moveFocus(event.key);
          }}
        >
          {entries.map((entry) =>
            entry.kind === "logout" ? (
              <form key={entry.label} action="/logout" method="post" className={logoutForm}>
                <button type="submit" role="menuitem" className={item}>
                  {entry.label}
                </button>
              </form>
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                role="menuitem"
                className={item}
                aria-current={entry.myPage && myPageCurrent ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {entry.label}
              </Link>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
