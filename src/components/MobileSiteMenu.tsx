"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { useRef, useState } from "react";

import { css, cva } from "../../styled-system/css";
import { BrandMark } from "./BrandMark";
import { buttonRecipe } from "./Button";
import { hasAuthSession, MEMBER_ENTRIES } from "./DesktopAccountMenu";
import { Icon } from "./Icon";

export type MobileSiteMenuLink = { label: string; href: string; current: boolean };

/** 3本線と「MENU」の文字。開いた面の上では同じ位置・同じ幅で × と「CLOSE」に変わる。 */
const menuButton = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "1.5",
  flexShrink: "0",
  w: "14",
  h: "11",
  justifyContent: "center",
  p: "0",
  borderWidth: "0",
  borderRadius: "button",
  bg: "transparent",
  cursor: "pointer",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "0.5",
  },
});

const lines = css({ position: "relative", w: "10", h: "[11px]" });

const line = cva({
  base: {
    position: "absolute",
    left: "0",
    right: "0",
    h: "[1.5px]",
    transitionProperty: "[transform]",
    transitionDuration: "menu",
    transitionTimingFunction: "out",
    // 視覚効果を減らす設定では、線を動かさず × をそのまま見せる
    _motionReduce: { transitionProperty: "[none]" },
  },
  variants: {
    tone: {
      paper: { bgColor: "text.default" },
      forest: { bgColor: "text.inverse" },
    },
    place: {
      top: { top: "0" },
      middle: { top: "[calc(50% - 0.75px)]" },
      bottom: { bottom: "0" },
    },
    // 開いた面の上の線は、面が広がるあいだに3本線から浅い × へ寄る
    cross: { true: {}, false: {} },
  },
  compoundVariants: [
    {
      cross: true,
      place: "top",
      css: {
        transform: "translateY(4.75px) rotate(-15deg)",
        "[data-starting-style] &": { transform: "none" },
        "[data-ending-style] &": { transform: "none" },
      },
    },
    {
      cross: true,
      place: "middle",
      css: {
        transform: "scaleX(0)",
        "[data-starting-style] &": { transform: "none" },
        "[data-ending-style] &": { transform: "none" },
      },
    },
    {
      cross: true,
      place: "bottom",
      css: {
        transform: "translateY(-4.75px) rotate(15deg)",
        "[data-starting-style] &": { transform: "none" },
        "[data-ending-style] &": { transform: "none" },
      },
    },
  ],
  defaultVariants: { cross: false },
});

const label = cva({
  base: { textStyle: "eyebrow", lineHeight: "none" },
  variants: { tone: { paper: { color: "text.default" }, forest: { color: "text.inverse" } } },
});

/**
 * 深い緑の面を、ボタンを中心に円で広げて開き、同じ円で閉じる。円の中心はヘッダーの右の余白と上の余白
 * （ノッチを含む）からボタンの中心に合わせる。中心が画面の中にあれば、隅までの距離はどの縦横比でも
 * 長い辺の √2 倍以下なので、半径を 145vmax にして面全体を必ず覆う。
 * 視覚効果を減らす設定では円を使わず、不透明度だけを変える。
 */
const panel = css({
  position: "fixed",
  inset: "0",
  zIndex: "dialog",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  bgColor: "surface.forest",
  layerStyle: "wash",
  color: "text.inverse",
  outline: "none",
  clipPath:
    "[circle(145vmax at calc(100% - {spacing.3.5} - {spacing.14} / 2) calc(max({spacing.3}, env(safe-area-inset-top)) + {spacing.11} / 2))]",
  transitionProperty: "[clip-path]",
  transitionDuration: "menu",
  transitionTimingFunction: "out",
  _startingStyle: {
    clipPath:
      "[circle(0 at calc(100% - {spacing.3.5} - {spacing.14} / 2) calc(max({spacing.3}, env(safe-area-inset-top)) + {spacing.11} / 2))]",
  },
  _endingStyle: {
    clipPath:
      "[circle(0 at calc(100% - {spacing.3.5} - {spacing.14} / 2) calc(max({spacing.3}, env(safe-area-inset-top)) + {spacing.11} / 2))]",
  },
  _motionReduce: {
    clipPath: "none",
    transitionProperty: "[opacity]",
    _startingStyle: { clipPath: "none", opacity: "0" },
    _endingStyle: { clipPath: "none", opacity: "0" },
  },
});

/** ヘッダーと同じ寸法で並べ、× をメニューボタンの位置に重ねる。 */
const bar = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  pt: "[max(token(spacing.3), env(safe-area-inset-top))]",
  px: "3.5",
  pb: "2.5",
});

const logo = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  flex: "1",
  minW: "0",
  color: "text.inverse",
  fontSize: "xl",
  fontWeight: "bold",
  textDecoration: "none",
});

const body = css({
  display: "flex",
  flexDirection: "column",
  gap: "10",
  px: "6",
  pt: "8",
  pb: "[calc({spacing.12} + env(safe-area-inset-bottom, 0px))]",
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
    borderBottomColor: "primary.700",
    bg: "transparent",
    color: "text.inverse",
    fontFamily: "sans",
    fontWeight: "bold",
    textAlign: "left",
    textDecoration: "none",
    cursor: "pointer",
    "&[aria-current=page]": { color: "text.brandOnForest" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "text.inverse",
      outlineOffset: "0.5",
    },
  },
  variants: {
    size: {
      site: { minH: "16", textStyle: "title" },
      account: { minH: "12", textStyle: "body" },
    },
  },
});

const guestActions = css({ display: "flex", flexDirection: "column", gap: "3" });

const signupAction = css(buttonRecipe.raw({ variant: "ghost" }), { borderColor: "transparent" });

const loginAction = css(buttonRecipe.raw({ variant: "ghost" }), {
  bg: "transparent",
  color: "text.inverse",
  borderColor: "text.inverse",
});

type MobileSiteMenuProps = {
  links: readonly MobileSiteMenuLink[];
  /**
   * 会員にはアカウントの項目を、未ログインにはログインと新規登録を出す。
   * 未指定は閲覧者を確かめていない画面（読み込み中・404 など）で、開いた時点の cookie で決める。
   */
  member?: boolean;
};

/** SP ヘッダーの右端に置くメニュー。PC ヘッダーと同じサイトメニューとアカウントの項目を、深い緑の面に並べる。 */
export function MobileSiteMenu({ links, member }: MobileSiteMenuProps) {
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isMember = member ?? signedIn;
  // 同じ画面へのリンクでは画面が切り替わらないので、押したら自分で閉じる
  const close = () => setOpen(false);

  return (
    <BaseDialog.Root
      onOpenChange={(next) => {
        if (next && member === undefined) setSignedIn(hasAuthSession());
        setOpen(next);
      }}
      open={open}
    >
      <BaseDialog.Trigger aria-label="メニュー" className={menuButton}>
        <span aria-hidden className={lines}>
          <span className={line({ tone: "paper", place: "top" })} />
          <span className={line({ tone: "paper", place: "middle" })} />
          <span className={line({ tone: "paper", place: "bottom" })} />
        </span>
        <span aria-hidden className={label({ tone: "paper" })}>
          MENU
        </span>
      </BaseDialog.Trigger>
      <BaseDialog.Portal>
        <BaseDialog.Popup className={panel} initialFocus={closeRef}>
          <BaseDialog.Title className={css({ srOnly: true })}>メニュー</BaseDialog.Title>
          <div className={bar}>
            <Link className={logo} href="/" onClick={close}>
              <BrandMark />
              Farmille
            </Link>
            <BaseDialog.Close aria-label="メニューを閉じる" className={menuButton} ref={closeRef}>
              <span aria-hidden className={lines}>
                <span className={line({ tone: "forest", place: "top", cross: true })} />
                <span className={line({ tone: "forest", place: "middle", cross: true })} />
                <span className={line({ tone: "forest", place: "bottom", cross: true })} />
              </span>
              <span aria-hidden className={label({ tone: "forest" })}>
                CLOSE
              </span>
            </BaseDialog.Close>
          </div>
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
                      <Icon name="arrow_forward" size="md" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {isMember ? (
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
                        <Link
                          className={row({ size: "account" })}
                          href={entry.href}
                          onClick={close}
                        >
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
                <Link className={signupAction} href="/signup/general" onClick={close}>
                  新規登録
                </Link>
                <Link className={loginAction} href="/login" onClick={close}>
                  ログイン
                </Link>
              </div>
            )}
          </div>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
