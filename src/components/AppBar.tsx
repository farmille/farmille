import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { Icon } from "@/components/Icon";

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
  gap: "3",
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

const desktopNav = css({
  display: "flex",
  alignItems: "center",
  gap: "1",
  ml: "auto",
});

const desktopPublicActions = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  flexShrink: "0",
});

const desktopSearch = css({
  minH: "42px",
  minW: "0",
  flex: "1",
  maxW: "480px",
  display: "flex",
  alignItems: "center",
  gap: "2",
  px: "3",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "button",
  color: "text.subtle",
  textDecoration: "none",
  _hover: { borderColor: "brand.primary" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "brand.primary",
    outlineOffset: "2px",
  },
});

const desktopSearchLabel = css({
  flex: "1",
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "sm",
});

const desktopSearchAction = css({
  color: "brand.primaryDeep",
  fontSize: "xs",
  fontWeight: "700",
  whiteSpace: "nowrap",
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

function MobileAppBar(props: AppBarProps) {
  if (props.variant === "home") {
    return (
      <header className={mobileAppBar} data-ui="mobile-app-bar">
        <Link href="/" className={logo}>
          <Icon name="leaf" size="lg" />
          <b className={logoText}>Farmille</b>
        </Link>
        <Link href={props.searchHref ?? "/search"} className={iconButton} aria-label="検索">
          <Icon name="search" size="sm" />
        </Link>
      </header>
    );
  }

  const backHref = props.backHref ?? "/";

  return (
    <header className={mobileAppBar} data-ui="mobile-app-bar">
      <Link href={backHref} className={iconButton} aria-label="戻る">
        <Icon name="chevron_left" size="md" />
      </Link>
      <div className={mobileTitle}>{props.title ?? ""}</div>
      {props.shareHref ? (
        <Link href={props.shareHref} className={iconButton} aria-label="共有">
          <Icon name="share" size="md" />
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
          <Icon name="leaf" size="lg" />
          <span className={desktopBrandName}>Farmille</span>
        </Link>
        <Link
          href="/articles?type=report"
          className={desktopNavLink({ active: active === "articles" })}
          aria-current={active === "articles" ? "page" : undefined}
        >
          使用レポート一覧
        </Link>
        <Link
          href="/search"
          className={desktopSearch}
          aria-current={active === "search" ? "page" : undefined}
        >
          <Icon name="search" size="sm" />
          <span className={desktopSearchLabel}>資材を検索（作物・悩み・資材名から）</span>
          <span className={desktopSearchAction}>検索へ →</span>
        </Link>
        <nav className={desktopPublicActions} aria-label="PCメインナビ">
          <Link
            href="/post"
            className={desktopAction({ emphasis: "primary" })}
            aria-current={active === "post" ? "page" : undefined}
          >
            <Icon name="add" size="sm" /> 投稿
          </Link>
          <Link
            href="/me"
            className={desktopAction({ emphasis: "secondary" })}
            aria-current={active === "me" ? "page" : undefined}
          >
            マイページ
          </Link>
        </nav>
      </div>
    </header>
  );
}

function DesktopContextBar(props: AppBarBackProps) {
  return (
    <div className={desktopContext} data-ui="desktop-context-bar">
      <div className={desktopContextInner}>
        <Link href={props.backHref ?? "/"} className={contextBack}>
          <Icon name="chevron_left" size="sm" />
          戻る
        </Link>
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
    <header className={desktopHeader} data-ui="desktop-seller-header">
      <div className={desktopHeaderInner}>
        <Link href="/dashboard" className={desktopBrand}>
          <Icon name="leaf" size="lg" />
          <span className={desktopBrandName}>Farmille メーカー</span>
        </Link>
        <span className={workspaceTitle}>{title}</span>
        <nav className={desktopNav} aria-label="メーカーナビ">
          <Link href="/dashboard" className={desktopNavLink()}>
            ホーム
          </Link>
          <Link href="/dashboard/materials" className={desktopNavLink()}>
            資材管理
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
