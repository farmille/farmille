import Link from "next/link";
import type { ReactNode } from "react";
import { cva, css, cx } from "../../styled-system/css";
import { BackLink } from "@/components/BackLink";
import { DesktopAccountMenu } from "@/components/DesktopAccountMenu";
import { BrandMark } from "@/components/BrandMark";
import { Icon } from "@/components/Icon";
import { MobileSiteMenu } from "@/components/MobileSiteMenu";
import { PreparationNotice } from "@/components/PreparationNotice";
import { TextLink } from "@/components/TextLink";

const mobileAppBar = css({
  bg: "surface.paper/88",
  position: "sticky",
  top: "0",
  zIndex: "appBar",
  backdropFilter: "[blur({blurs.bar})]",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  pt: "[max(token(spacing.3), env(safe-area-inset-top))]",
  px: "3.5",
  pb: "2.5",
  tab: { display: "none" },
});

/** 指で押せるよう 44px 四方を取り、負の余白で行の高さと並びは 32px 分に保つ。 */
const iconButton = css({
  w: "11",
  h: "11",
  m: "-1.5",
  display: "grid",
  placeItems: "center",
  color: "text.muted",
  borderRadius: "button",
  bg: "transparent",
  borderWidth: "0",
  padding: "0",
  cursor: "pointer",
  flexShrink: "0",
  textDecoration: "none",
});

const logo = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  flex: "1",
  color: "text.brand",
  textDecoration: "none",
  minW: "0",
});

const logoText = css({
  fontSize: "xl",
  fontWeight: "bold",
  color: "text.default",
});

/** SP の公開画面で、サイトヘッダーの下に置く「戻る」と画面名の行。上に固定せず、本文と一緒に流れる。 */
const mobileContext = css({
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  px: "3.5",
  py: "1.5",
  bg: "surface.panel",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  tab: { display: "none" },
});

const mobileTitle = css({
  fontSize: "lg",
  fontWeight: "bold",
  flex: "1",
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "text.default",
});

const desktopHeader = css({
  display: "none",
  tab: {
    display: "block",
    position: "sticky",
    top: "0",
    zIndex: "header",
    bg: "surface.paper/94",
    backdropFilter: "[blur(12px)]",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border.default",
  },
});

const desktopHeaderInner = css({
  w: "full",
  minH: "16",
  px: "6",
  display: "flex",
  alignItems: "center",
  gap: "3",
  pc: { px: "10" },
});

const desktopBrand = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  color: "text.brand",
  textDecoration: "none",
  flexShrink: "0",
});

const desktopBrandName = css({
  color: "text.default",
  fontSize: "xl",
  fontWeight: "extrabold",
});

const desktopNav = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  ml: "auto",
});

/** 公開画面の主な行き先。PC のヘッダーには文字だけを並べ、SP ではメニューに同じ順で並べる。 */
const siteMenu = [
  { label: "資材をさがす", href: "/search", active: "search" },
  { label: "記事", href: "/articles", active: "articles" },
  { label: "投稿する", href: "/post", active: "post" },
  { label: "メーカーの方へ", href: "/sellers", active: null },
] as const satisfies readonly { label: string; href: string; active: AppBarActive | null }[];

/** 投稿は一般向けの機能なので、企業会員には「投稿する」を出さない（BottomNav と同じ条件）。 */
function cannotPost(account?: AppBarAccount) {
  return account?.kind === "member" && !account.canPost;
}

function siteMenuFor(account?: AppBarAccount) {
  return cannotPost(account) ? siteMenu.filter((item) => item.active !== "post") : siteMenu;
}

/** ルートレイアウトのフッターは閲覧者を知らないので、ヘッダーの目印を見て投稿のリンクを隠す。 */
function postMarker(account?: AppBarAccount) {
  return cannotPost(account) ? "false" : undefined;
}

/** 同じく、ログイン中はフッターの会員登録のリンクを隠すための目印。 */
function signedInMarker(account?: AppBarAccount) {
  return account?.kind === "member" ? "true" : undefined;
}

const desktopSiteMenuNav = css({ ml: "auto" });

const desktopSiteMenu = css({
  display: "flex",
  alignItems: "center",
  gap: "5",
  m: "0",
  p: "0",
  listStyle: "none",
  color: "text.brandOnSoft",
  fontSize: "md",
  fontWeight: "bold",
  whiteSpace: "nowrap",
  pc: { gap: "8" },
});

const desktopPublicActions = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  flexShrink: "0",
  ml: "6",
  pc: { ml: "10" },
});

const desktopNavLink = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    minH: "10",
    px: "3",
    borderRadius: "button",
    color: "text.muted",
    fontSize: "md",
    fontWeight: "bold",
    textDecoration: "none",
    whiteSpace: "nowrap",
    _hover: { bg: "primary.soft", color: "text.brandOnSoft" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.600",
      outlineOffset: "0.5",
    },
  },
  variants: {
    active: {
      true: { bg: "primary.soft", color: "text.brandOnSoft" },
      false: {},
    },
  },
  defaultVariants: { active: false },
});

const desktopAction = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minH: "10",
    px: "3.5",
    borderRadius: "button",
    fontSize: "md",
    fontWeight: "bold",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  variants: {
    emphasis: {
      primary: { bg: "primary.700", color: "surface.card" },
      secondary: {
        bg: "surface.card",
        color: "text.brand",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "border.strong",
      },
    },
  },
  defaultVariants: { emphasis: "secondary" },
});

const desktopContext = css({
  display: "none",
  tab: {
    display: "block",
    bg: "surface.panel",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border.default",
  },
});

const desktopContextInner = css({
  w: "full",
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  py: "2.5",
  display: "flex",
  alignItems: "center",
  gap: "6",
});

const contextBack = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  color: "text.muted",
  fontSize: "sm",
  fontWeight: "bold",
  textDecoration: "none",
  flexShrink: "0",
});

const contextTitle = css({
  flex: "1",
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "text.default",
  fontSize: "md",
  fontWeight: "bold",
});

const workspaceTitle = css({
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "text.default",
  fontSize: "md",
  fontWeight: "bold",
});

export type AppChrome = "public" | "seller";
export type AppBarActive = "home" | "search" | "post" | "articles" | "me";

/** PCヘッダー右端に出す、閲覧者に応じたアカウント欄。会員の画像はサーバー側で描いたものを受け取る（SiteAppBar が渡す）。 */
export type AppBarAccount =
  | { kind: "guest" }
  | {
      kind: "member";
      avatar: ReactNode;
      /** 一般向けの機能（投稿）を使える会員か。企業会員は使えない。 */
      canPost: boolean;
    };

type AppBarBaseProps = {
  chrome: AppChrome;
  /** false で公開準備中のお知らせを出さない。 */
  preparationNotice?: boolean;
  active?: AppBarActive;
  /** 未指定は閲覧者を確かめていない画面（エラー・読み込み中など）で、開いた時点で項目を切り替えるメニューを出す。 */
  account?: AppBarAccount;
};

type AppBarHomeProps = AppBarBaseProps & {
  variant: "home";
};

type AppBarBackProps = AppBarBaseProps & {
  variant?: "back";
  title?: string;
  /** このサイトの画面から来ていないときの戻り先。未指定は "/"。 */
  backHref?: string;
  shareHref?: string;
};

export type AppBarProps = AppBarHomeProps | AppBarBackProps;

/** SP のサイトヘッダー。ロゴと、PC のヘッダーと同じ項目を並べるメニュー。 */
function MobileSiteBar({ active, account }: Pick<AppBarBaseProps, "active" | "account">) {
  return (
    <header className={mobileAppBar} data-ui="mobile-app-bar">
      <Link href="/" className={logo}>
        <BrandMark />
        <b className={logoText}>Farmille</b>
      </Link>
      <MobileSiteMenu
        links={siteMenuFor(account).map((item) => ({
          label: item.label,
          href: item.href,
          current: item.active !== null && active === item.active,
        }))}
        member={account === undefined ? undefined : account.kind === "member"}
      />
    </header>
  );
}

/**
 * SP の公開画面は PC と同じく、サイトヘッダーの下に「戻る」と画面名を置く。
 * メーカー向けの画面は、「戻る」と画面名をそのまま上に固定する。
 */
function MobileAppBar(props: AppBarProps) {
  if (props.variant === "home") {
    return <MobileSiteBar active={props.active} account={props.account} />;
  }

  const backRow = (
    <>
      <BackLink href={props.backHref ?? "/"} className={iconButton} aria-label="戻る">
        <Icon name="chevron_left" size="md" />
      </BackLink>
      <div className={mobileTitle}>{props.title ?? ""}</div>
      {props.shareHref ? (
        <Link href={props.shareHref} className={iconButton} aria-label="共有">
          <Icon name="share" size="md" />
        </Link>
      ) : (
        <span className={cx(iconButton, css({ visibility: "hidden" }))} aria-hidden />
      )}
    </>
  );

  if (props.chrome === "public") {
    return (
      <>
        <MobileSiteBar active={props.active} account={props.account} />
        <div className={mobileContext} data-ui="mobile-context-bar">
          {backRow}
        </div>
      </>
    );
  }

  return (
    <header className={mobileAppBar} data-ui="mobile-app-bar">
      {backRow}
    </header>
  );
}

function DesktopSiteHeader({
  active,
  account,
}: {
  active?: AppBarActive;
  account?: AppBarAccount;
}) {
  return (
    <header
      className={desktopHeader}
      data-can-post={postMarker(account)}
      data-signed-in={signedInMarker(account)}
      data-ui="desktop-site-header"
    >
      <div className={desktopHeaderInner}>
        <Link href="/" className={desktopBrand}>
          <BrandMark />
          <span className={desktopBrandName}>Farmille</span>
        </Link>
        <nav aria-label="サイトメニュー" className={desktopSiteMenuNav}>
          <ul className={desktopSiteMenu}>
            {siteMenuFor(account).map((item) => (
              <li key={item.href}>
                <TextLink
                  aria-current={item.active !== null && active === item.active ? "page" : undefined}
                  href={item.href}
                  variant="nav"
                >
                  {item.label}
                </TextLink>
              </li>
            ))}
          </ul>
        </nav>
        <nav className={desktopPublicActions} aria-label="PCメインナビ">
          {account?.kind === "guest" ? (
            <>
              <Link href="/login" className={desktopAction({ emphasis: "secondary" })}>
                ログイン
              </Link>
              <Link href="/signup/general" className={desktopAction({ emphasis: "primary" })}>
                新規登録
              </Link>
            </>
          ) : (
            <DesktopAccountMenu myPageCurrent={active === "me"} member={account} />
          )}
        </nav>
      </div>
    </header>
  );
}

function DesktopContextBar(props: AppBarBackProps) {
  return (
    <div className={desktopContext} data-ui="desktop-context-bar">
      <div className={desktopContextInner}>
        <BackLink href={props.backHref ?? "/"} className={contextBack}>
          <Icon name="chevron_left" size="sm" />
          戻る
        </BackLink>
        <div className={contextTitle}>{props.title ?? ""}</div>
        {props.shareHref ? (
          <Link href={props.shareHref} className={iconButton} aria-label="共有">
            <Icon name="share" size="md" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function DesktopSellerHeader(props: AppBarProps) {
  const title = props.variant === "home" ? "メーカーダッシュボード" : (props.title ?? "");

  return (
    <header
      className={desktopHeader}
      data-can-post={postMarker(props.account)}
      data-signed-in={signedInMarker(props.account)}
      data-ui="desktop-seller-header"
    >
      <div className={desktopHeaderInner}>
        <Link href="/dashboard" className={desktopBrand}>
          <BrandMark />
          <span className={desktopBrandName}>Farmille for Business</span>
        </Link>
        <span className={workspaceTitle}>{title}</span>
        <nav className={desktopNav} aria-label="メーカーナビ">
          <Link href="/dashboard" className={desktopNavLink()}>
            ホーム
          </Link>
          <Link href="/dashboard/materials" className={desktopNavLink()}>
            製品情報
          </Link>
          <Link href="/dashboard/profile" className={desktopNavLink()}>
            会社情報
          </Link>
          <Link href="/dashboard/articles" className={desktopNavLink()}>
            記事管理
          </Link>
          <Link href="/" className={desktopAction({ emphasis: "secondary" })}>
            公開サイトを見る
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** 画面幅と利用文脈に応じ、モバイル AppBar／PC用 chrome を置き換える。 */
export function AppBar(props: AppBarProps) {
  return (
    <>
      <MobileAppBar {...props} />
      {props.chrome === "public" ? (
        <>
          <DesktopSiteHeader active={props.active} account={props.account} />
          {props.preparationNotice === false ? null : <PreparationNotice />}
          {props.variant === "home" ? null : <DesktopContextBar {...props} />}
        </>
      ) : (
        <>
          <DesktopSellerHeader {...props} />
          <PreparationNotice />
        </>
      )}
    </>
  );
}
