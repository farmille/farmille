"use client";

import Link from "next/link";
import { useState } from "react";

import { css, cva } from "../../styled-system/css";
import { buttonRecipe } from "./Button";
import { MEMBER_ENTRIES } from "./DesktopAccountMenu";
import { Dialog } from "./Dialog";
import { Icon } from "./Icon";

export type MobileSiteMenuLink = { label: string; href: string; current: boolean };

const trigger = css({
  w: "10",
  h: "10",
  display: "grid",
  placeItems: "center",
  flexShrink: "0",
  p: "0",
  borderWidth: "0",
  borderRadius: "button",
  bg: "transparent",
  color: "text.default",
  cursor: "pointer",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "0.5",
  },
});

const body = css({
  display: "flex",
  flexDirection: "column",
  gap: "8",
  px: "5",
  pt: "2",
  pb: "[calc({spacing.10} + env(safe-area-inset-bottom, 0px))]",
});

const list = css({ listStyle: "none", m: "0", p: "0" });

/** サイトメニューは大きく、アカウントの項目は一段小さく並べる。 */
const row = cva({
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "3",
    w: "full",
    p: "0",
    borderWidth: "0",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border.default",
    bg: "transparent",
    color: "text.default",
    fontFamily: "sans",
    fontWeight: "bold",
    textAlign: "left",
    textDecoration: "none",
    cursor: "pointer",
    "&[aria-current=page]": { color: "text.brand" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.600",
      outlineOffset: "0.5",
    },
  },
  variants: {
    size: {
      site: { minH: "14", textStyle: "title" },
      account: { minH: "12", textStyle: "body" },
    },
  },
});

const guestActions = css({ display: "flex", flexDirection: "column", gap: "3" });

type MobileSiteMenuProps = {
  links: readonly MobileSiteMenuLink[];
  /** 会員にはアカウントの項目を、未ログインにはログインと新規登録を出す。 */
  member: boolean;
};

/** SP ヘッダーの右端に置くメニュー。PC ヘッダーと同じサイトメニューとアカウントの項目を全画面に並べる。 */
export function MobileSiteMenu({ links, member }: MobileSiteMenuProps) {
  const [open, setOpen] = useState(false);
  // 同じ画面へのリンクでは画面が切り替わらないので、押したら自分で閉じる
  const close = () => setOpen(false);

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="メニュー"
        className={trigger}
        onClick={() => setOpen(true)}
        type="button"
      >
        <Icon name="menu" size="md" />
      </button>
      <Dialog onOpenChange={setOpen} open={open} size="fullscreen" title="メニュー">
        <div className={body}>
          <nav aria-label="サイトメニュー">
            <ul className={list}>
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    aria-current={link.current ? "page" : undefined}
                    className={row({ size: "site" })}
                    href={link.href}
                    onClick={close}
                  >
                    {link.label}
                    <Icon name="chevron_right" size="md" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {member ? (
            <section aria-label="アカウント">
              <ul className={list}>
                {MEMBER_ENTRIES.map((entry) =>
                  entry.kind === "logout" ? (
                    <li key={entry.label}>
                      <form action="/logout" method="post">
                        <button className={row({ size: "account" })} type="submit">
                          {entry.label}
                        </button>
                      </form>
                    </li>
                  ) : (
                    <li key={entry.href}>
                      <Link className={row({ size: "account" })} href={entry.href} onClick={close}>
                        {entry.label}
                        <Icon name="chevron_right" size="sm" />
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </section>
          ) : (
            <div className={guestActions}>
              <Link className={buttonRecipe({ variant: "ghost" })} href="/login" onClick={close}>
                ログイン
              </Link>
              <Link className={buttonRecipe()} href="/signup/general" onClick={close}>
                新規登録
              </Link>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
