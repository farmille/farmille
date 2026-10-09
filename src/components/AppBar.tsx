import Form from "next/form";
import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { DesktopAccountMenu } from "@/components/DesktopAccountMenu";
import { BrandMark } from "@/components/BrandMark";
import { Icon } from "@/components/Icon";
import { PreparationNotice } from "@/components/PreparationNotice";

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
  pt: "max(token(spacing.3), env(safe-area-inset-top))",
  px: "3.5",
  pb: "2.5",
  tab: { display: "none" },
});

const iconButton = css({
  w: "8",
  h: "8",
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
  color: "primary.700",
  textDecoration: "none",
  minW: "0",
});

const logoText = css({
  fontSize: "xl",
  fontWeight: "bold",
  color: "text.default",
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
  minH: "16",
  px: "5",
  display: "flex",
  alignItems: "center",
  gap: "3",
});

const desktopBrand = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2",
  color: "primary.700",
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

const desktopPublicActions = css({
  display: "flex",
  alignItems: "center",
  gap: "1.5",
  flexShrink: "0",
});

const desktopSearch = css({
  minH: "11",
  minW: "0",
  flex: "1",
  maxW: "480px",
  display: "flex",
  alignItems: "center",
  gap: "2",
  px: "3",
  m: "0",
  bg: "surface.card",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.strong",
  borderRadius: "button",
  color: "text.subtle",
  _hover: { borderColor: "primary.600" },
  // 送信ボタンのフォーカスでは枠を出さず、入力欄のときだけ検索画面と同じ焦点表現にする
  "&:has(input:focus-visible)": {
    borderColor: "primary.600",
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.200",
  },
});

const desktopSearchInput = css({
  flex: "1",
  minW: "0",
  bg: "transparent",
  borderWidth: "0",
  outline: "none",
  p: "0",
  fontFamily: "sans",
  fontSize: "md",
  color: "text.default",
  appearance: "none",
  _placeholder: { color: "text.subtle" },
  "&::-webkit-search-cancel-button": { display: "none" },
  "&::-webkit-search-decoration": { display: "none" },
});

const desktopSearchAction = css({
  color: "primary.700",
  fontSize: "xs",
  fontWeight: "bold",
  whiteSpace: "nowrap",
  bg: "transparent",
  borderWidth: "0",
  p: "0",
  cursor: "pointer",
  fontFamily: "sans",
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    outlineOffset: "2px",
  },
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
    _hover: { bg: "primary.soft", color: "primary.700" },
    _focusVisible: {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.600",
      outlineOffset: "2px",
    },
  },
  variants: {
    active: {
      true: { bg: "primary.soft", color: "primary.700" },
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
        color: "primary.700",
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
  w: "100%",
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

type AppBarBaseProps = {
  chrome: AppChrome;
  overlapNoticeImage?: boolean;
  active?: AppBarActive;
  /** PC ヘッダーの検索入力欄の初期値。`/search` が現在の q を渡す。未指定なら空。 */
  searchQuery?: string;
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
          <BrandMark />
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

function DesktopSiteHeader({
  active,
  searchQuery,
}: {
  active?: AppBarActive;
  searchQuery?: string;
}) {
  return (
    <header className={desktopHeader} data-ui="desktop-site-header">
      <div className={desktopHeaderInner}>
        <Link href="/" className={desktopBrand}>
          <BrandMark />
          <span className={desktopBrandName}>Farmille</span>
        </Link>
        <Form action="/search" aria-label="ヘッダー検索" className={desktopSearch} role="search">
          <Icon name="search" size="sm" />
          <input
            // q が変わったとき（同じ画面での再送信や履歴の前後移動）に入力欄を作り直して反映する
            key={searchQuery}
            aria-label="資材を検索"
            autoComplete="off"
            className={desktopSearchInput}
            defaultValue={searchQuery}
            enterKeyHint="search"
            name="q"
            placeholder="作物・悩み・資材名から資材を検索"
            type="search"
          />
          <button className={desktopSearchAction} type="submit">
            検索
          </button>
        </Form>
        <nav className={desktopPublicActions} aria-label="PCメインナビ">
          <DesktopAccountMenu myPageCurrent={active === "me"} />
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
          <DesktopSiteHeader active={props.active} searchQuery={props.searchQuery} />
          <PreparationNotice overlapImage={props.overlapNoticeImage} />
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
