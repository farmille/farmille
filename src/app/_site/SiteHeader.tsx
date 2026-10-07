import Form from "next/form";
import Link from "next/link";

import { DesktopAccountMenu } from "@/components/DesktopAccountMenu";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { getSessionUser } from "@/server/auth";
import { css, cva } from "../../../styled-system/css";

export type SiteNavActive = "search" | "me";

type SiteHeaderProps = {
  active?: SiteNavActive;
  searchQuery?: string;
  showSearch?: boolean;
};

function SearchIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}

const header = css({
  position: "relative",
  zIndex: "30",
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  px: "3",
  pt: "max(token(spacing.2), env(safe-area-inset-top))",
  pb: "2",
  bg: "surface.card",
  borderBottomWidth: "1px",
  borderBottomStyle: "solid",
  borderBottomColor: "border.default",
  pc: {
    gap: "1",
    px: "6",
    pt: "max(token(spacing.2.5), env(safe-area-inset-top))",
    pb: "2.5",
  },
});

const logo = css({
  flex: "0 0 auto",
  mr: "2.5",
  color: "text.default",
  fontSize: "lg",
  fontWeight: "extrabold",
  textDecoration: "none",
  whiteSpace: "nowrap",
  pc: { mr: "5.5", fontSize: "xl" },
});

const scroller = css({
  display: "flex",
  alignItems: "center",
  gap: "0.5",
  flex: "1",
  minW: "0",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
  pc: { display: "contents" },
});

const navItem = cva({
  base: {
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: "2",
    px: "2",
    py: "2",
    borderRadius: "input",
    color: "text.muted",
    fontSize: "sm",
    fontWeight: "bold",
    textDecoration: "none",
    whiteSpace: "nowrap",
    _hover: { color: "text.default", bg: "surface.page" },
    "& svg": { display: "block" },
    pc: { px: "3.5" },
  },
  variants: {
    kind: {
      search: { flexDirection: "row-reverse" },
      mypage: { display: "none", tab: { display: "flex" }, pc: { ml: "2.5" } },
    },
    active: {
      true: {
        color: "primary.700",
        bg: "primary.100",
        _hover: { color: "primary.700", bg: "primary.100" },
      },
      false: {},
    },
  },
});

const search = css({
  display: "none",
  pc: {
    display: "flex",
    alignItems: "center",
    gap: "2.5",
    flex: "1 1 token(spacing.60)",
    minW: "48",
    maxW: "auth",
    ml: "auto",
    px: "3.5",
    py: "2",
    bg: "surface.page",
    color: "text.subtle",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: "border.strong",
    borderRadius: "pill",
    "&:hover, &:has(input:focus-visible)": { borderColor: "primary.700" },
    "&:has(input:focus-visible)": {
      outlineWidth: "2px",
      outlineStyle: "solid",
      outlineColor: "primary.700",
      outlineOffset: "2px",
    },
  },
});

const searchInput = css({
  flex: "1",
  minW: "0",
  p: "0",
  border: "none",
  outline: "none",
  bg: "transparent",
  fontSize: "sm",
  color: "text.default",
  appearance: "none",
  _placeholder: { color: "text.subtle" },
  "&::-webkit-search-cancel-button, &::-webkit-search-decoration": { display: "none" },
});

const searchSubmit = css({
  p: "0",
  border: "none",
  bg: "transparent",
  color: "primary.700",
  fontSize: "xs",
  fontWeight: "bold",
  whiteSpace: "nowrap",
});

const postSlot = css({
  flex: "0 0 auto",
  ml: "auto",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const postLink = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "2",
  px: "3",
  py: "2",
  borderRadius: "input",
  bg: "primary.700",
  color: "text.inverse",
  fontSize: "sm",
  fontWeight: "bold",
  textDecoration: "none",
  whiteSpace: "nowrap",
  pc: { px: "4", py: "2.5" },
});

const authLinks = css({
  flex: "0 0 auto",
  display: "flex",
  alignItems: "center",
  gap: "2",
  ml: "1.5",
  whiteSpace: "nowrap",
  pc: { ml: "3" },
});

const loginLink = css({
  px: "2.5",
  py: "2",
  borderRadius: "input",
  color: "text.muted",
  fontSize: "sm",
  fontWeight: "bold",
  textDecoration: "none",
  whiteSpace: "nowrap",
  _hover: { color: "text.default", bg: "surface.page" },
});

const signupLink = css({
  px: "2.5",
  py: "2",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "primary.700",
  borderRadius: "input",
  bg: "surface.card",
  color: "primary.800",
  fontSize: "sm",
  fontWeight: "bold",
  textDecoration: "none",
  whiteSpace: "nowrap",
  _hover: { bg: "primary.100" },
  pc: { px: "3.5" },
});

const accountSlot = css({ flex: "0 0 auto", ml: "1", pc: { ml: "2" } });

export async function SiteHeader({ active, searchQuery, showSearch = true }: SiteHeaderProps) {
  const session = await getSessionUser();
  const signedIn = session !== null;
  const generalUser = signedIn && canUseGeneralFeatures(session.accountType);
  const showPost = !signedIn || generalUser;

  return (
    <header className={header}>
      <Link href="/" className={logo}>
        Farmille
      </Link>
      <nav className={scroller} aria-label="メインナビ">
        <Link
          href="/search"
          className={navItem({ kind: "search", active: active === "search" })}
          aria-current={active === "search" ? "page" : undefined}
        >
          <SearchIcon size={15} />
          <span>資材をさがす</span>
        </Link>
        {showSearch ? (
          <Form action="/search" aria-label="ヘッダー検索" className={search} role="search">
            <SearchIcon size={17} />
            <input
              key={searchQuery}
              aria-label="資材を検索"
              autoComplete="off"
              className={searchInput}
              defaultValue={searchQuery}
              enterKeyHint="search"
              name="q"
              placeholder="資材を検索"
              type="search"
            />
            <button className={searchSubmit} type="submit">
              検索へ →
            </button>
          </Form>
        ) : null}
        {showPost ? (
          <div className={postSlot}>
            <Link href="/post" className={postLink} aria-label="投稿する">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                aria-hidden
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span aria-hidden>投稿</span>
            </Link>
          </div>
        ) : null}
        {signedIn ? (
          generalUser ? (
            <Link
              href="/me"
              className={navItem({ kind: "mypage", active: active === "me" })}
              aria-current={active === "me" ? "page" : undefined}
            >
              マイページ
            </Link>
          ) : null
        ) : (
          <div className={authLinks}>
            <Link href="/login" className={loginLink}>
              ログイン
            </Link>
            <Link href="/signup/general" className={signupLink}>
              新規会員登録
            </Link>
          </div>
        )}
      </nav>
      {signedIn ? (
        <div className={accountSlot}>
          <DesktopAccountMenu myPageCurrent={active === "me"} />
        </div>
      ) : null}
    </header>
  );
}
