import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { BackIcon, LeafIcon, SearchIcon, ShareIcon } from "./Icons";

const mobileAppBar = css({
  position: "sticky",
  top: "0",
  zIndex: "10",
  bg: "panel/88",
  backdropFilter: "blur(10px)",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  pt: "max(12px, env(safe-area-inset-top))",
  px: "3.5",
  pb: "2.5",
  lg: { display: "none" },
});

const iconButton = css({
  w: "32px",
  h: "32px",
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
  color: "brand.primary",
  textDecoration: "none",
  minW: "0",
});

const logoText = css({
  fontSize: "xl",
  fontWeight: "700",
  color: "text.default",
});

const mobileTitle = css({
  fontSize: "lg",
  fontWeight: "700",
  flex: "1",
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "text.default",
});

const desktopHeader = css({
  display: "none",
  lg: {
    display: "block",
    position: "sticky",
    top: "0",
    zIndex: "30",
    bg: "card/94",
    backdropFilter: "blur(12px)",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border.default",
  },
});

const desktopHeaderInner = css({
  w: "100%",
  maxW: "content.wide",
  mx: "auto",
  minH: "64px",
  px: "5",
  display: "flex",
  alignItems: "center",
  gap: "5",
});

const desktopBrand = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  color: "brand.primary",
  textDecoration: "none",
  flexShrink: "0",
});

const desktopBrandName = css({
  color: "text.default",
  fontSize: "xl",
  fontWeight: "800",
});

const catchCopy = css({
  display: "none",
  color: "text.subtle",
  fontSize: "xs",
  whiteSpace: "nowrap",
  xl: { display: "block" },
});

const desktopNav = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  ml: "auto",
});

const desktopNavLink = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    minH: "40px",
    px: "3",
    borderRadius: "button",
    color: "text.muted",
    fontSize: "md",
    fontWeight: "700",
    textDecoration: "none",
    whiteSpace: "nowrap",
    _hover: { bg: "brand.soft", color: "brand.primaryDeep" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "brand.primary",
      outlineOffset: "2px",
    },
  },
  variants: {
    active: {
      true: { bg: "brand.soft", color: "brand.primaryDeep" },
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
    minH: "40px",
    px: "3.5",
    borderRadius: "button",
    fontSize: "md",
    fontWeight: "700",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  variants: {
    emphasis: {
      primary: { bg: "brand.primary", color: "surface.card" },
      secondary: {
        bg: "surface.card",
        color: "brand.primaryDeep",
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
  lg: {
    display: "block",
    bg: "surface.panel",
    borderBottomWidth: "1px",
    borderBottomStyle: "solid",
    borderBottomColor: "border.default",
  },
});

const desktopContextInner = css({
  w: "100%",
  maxW: "content.wide",
  mx: "auto",
  px: "5",
  py: "2.5",
  display: "flex",
  alignItems: "center",
  gap: "3",
});

const contextBack = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  color: "text.muted",
  fontSize: "sm",
  fontWeight: "700",
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
  fontWeight: "700",
});

const workspaceTitle = css({
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "text.default",
  fontSize: "md",
  fontWeight: "700",
});

export type AppChrome = "public" | "seller";
export type AppBarActive = "home" | "search" | "post" | "articles" | "me";

type AppBarBaseProps = {
  chrome: AppChrome;
  active?: AppBarActive;
};

type AppBarHomeProps = AppBarBaseProps & {
  variant: "home";
  searchHref?: string;
};

type AppBarBackProps = AppBarBaseProps & {
  variant?: "back";
  title?: string;
  /** 戻る先。未指定時はブラウザ履歴に依存させず "/" へ。 */
  backHref?: string;
  shareHref?: string;
};

export type AppBarProps = AppBarHomeProps | AppBarBackProps;

const PUBLIC_NAV_ITEMS: ReadonlyArray<{
  id: Exclude<AppBarActive, "post" | "me">;
  href: string;
  label: string;
}> = [
  { id: "home", href: "/", label: "ホーム" },
  { id: "search", href: "/search", label: "資材を探す" },
  { id: "articles", href: "/articles", label: "記事を読む" },
];

function MobileAppBar(props: AppBarProps) {
  if (props.variant === "home") {
    return (
      <header className={mobileAppBar} data-ui="mobile-app-bar">
        <Link href="/" className={logo}>
          <LeafIcon size={24} />
          <b className={logoText}>Farmille</b>
        </Link>
        <Link href={props.searchHref ?? "/search"} className={iconButton} aria-label="検索">
          <SearchIcon size={17} />
        </Link>
      </header>
    );
  }

  const backHref = props.backHref ?? "/";

  return (
    <header className={mobileAppBar} data-ui="mobile-app-bar">
      <Link href={backHref} className={iconButton} aria-label="戻る">
        <BackIcon />
      </Link>
      <div className={mobileTitle}>{props.title ?? ""}</div>
      {props.shareHref ? (
        <Link href={props.shareHref} className={iconButton} aria-label="共有">
          <ShareIcon />
        </Link>
      ) : (
        <span className={cx(iconButton, css({ visibility: "hidden" }))} aria-hidden />
      )}
    </header>
  );
}

function DesktopSiteHeader({ active }: { active?: AppBarActive }) {
  return (
    <header className={desktopHeader} data-ui="desktop-site-header">
      <div className={desktopHeaderInner}>
        <Link href="/" className={desktopBrand}>
          <LeafIcon size={25} />
          <span className={desktopBrandName}>Farmille</span>
        </Link>
        <span className={catchCopy}>農業の未来を、みんなの知恵で。</span>
        <nav className={desktopNav} aria-label="PCメインナビ">
          {PUBLIC_NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={desktopNavLink({ active: active === item.id })}
              aria-current={active === item.id ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/post" className={desktopAction({ emphasis: "primary" })}>
          投稿する
        </Link>
        <Link
          href="/me"
          className={desktopAction({ emphasis: "secondary" })}
          aria-current={active === "me" ? "page" : undefined}
        >
          アカウント
        </Link>
      </div>
    </header>
  );
}

function DesktopContextBar(props: AppBarBackProps) {
  return (
    <div className={desktopContext} data-ui="desktop-context-bar">
      <div className={desktopContextInner}>
        <Link href={props.backHref ?? "/"} className={contextBack}>
          <BackIcon size={16} />
          戻る
        </Link>
        <div className={contextTitle}>{props.title ?? ""}</div>
        {props.shareHref ? (
          <Link href={props.shareHref} className={iconButton} aria-label="共有">
            <ShareIcon />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function DesktopSellerHeader(props: AppBarProps) {
  const title = props.variant === "home" ? "出品者ダッシュボード" : (props.title ?? "");

  return (
    <header className={desktopHeader} data-ui="desktop-seller-header">
      <div className={desktopHeaderInner}>
        <Link href="/dashboard" className={desktopBrand}>
          <LeafIcon size={25} />
          <span className={desktopBrandName}>Farmille 出品者</span>
        </Link>
        <span className={workspaceTitle}>{title}</span>
        <nav className={desktopNav} aria-label="出品者ナビ">
          <Link href="/dashboard" className={desktopNavLink()}>
            ホーム
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
          <DesktopSiteHeader active={props.active} />
          {props.variant === "home" ? null : <DesktopContextBar {...props} />}
        </>
      ) : (
        <DesktopSellerHeader {...props} />
      )}
    </>
  );
}
