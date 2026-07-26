import Link from "next/link";
import { cva, css, cx } from "../../styled-system/css";
import { BackIcon, LeafIcon, SearchIcon, ShareIcon } from "./icons";

const appBarRecipe = cva({
  base: {
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
  },
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
  color: "brand.primary",
  textDecoration: "none",
  minW: "0",
});

const logoText = css({
  fontSize: "xl",
  fontWeight: "700",
  color: "text.default",
});

const title = css({
  fontSize: "lg",
  fontWeight: "700",
  flex: "1",
  minW: "0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "text.default",
});

type AppBarHomeProps = {
  variant: "home";
  searchHref?: string;
};

type AppBarBackProps = {
  variant?: "back";
  title?: string;
  /** 戻る先。未指定時はブラウザ履歴に依存させず "/" へ。 */
  backHref?: string;
  shareHref?: string;
};

export type AppBarProps = AppBarHomeProps | AppBarBackProps;

/** sticky AppBar。home（ロゴ＋検索）／戻る（＋任意で共有）。 */
export function AppBar(props: AppBarProps) {
  if (props.variant === "home") {
    const searchHref = props.searchHref ?? "/search";
    return (
      <header className={appBarRecipe()}>
        <Link href="/" className={logo}>
          <LeafIcon size={24} />
          <b className={logoText}>Farmille</b>
        </Link>
        <Link href={searchHref} className={iconButton} aria-label="検索">
          <SearchIcon size={17} />
        </Link>
      </header>
    );
  }

  const backHref = props.backHref ?? "/";
  const shareHref = props.shareHref;

  return (
    <header className={appBarRecipe()}>
      <Link href={backHref} className={iconButton} aria-label="戻る">
        <BackIcon />
      </Link>
      <div className={title}>{props.title ?? ""}</div>
      {shareHref ? (
        <Link href={shareHref} className={iconButton} aria-label="共有">
          <ShareIcon />
        </Link>
      ) : (
        <span className={cx(iconButton, css({ visibility: "hidden" }))} aria-hidden />
      )}
    </header>
  );
}
