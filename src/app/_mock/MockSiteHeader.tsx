import Form from "next/form";
import Link from "next/link";

import { DesktopAccountMenu } from "@/components/DesktopAccountMenu";
import { canUseGeneralFeatures } from "@/lib/auth/capabilities";
import { getSessionUser } from "@/server/auth";

export type MockNavActive = "search" | "me";

type MockSiteHeaderProps = {
  /** 現在地のナビ項目（見本 .bn-item.on）。資材ページなど該当しない画面では渡さない。 */
  active?: MockNavActive;
  /** ヘッダー検索の初期値。検索画面が現在の q を渡す。 */
  searchQuery?: string;
  /** 見本のホームはヒーローに検索欄があるので、ヘッダーの検索バーを出さない。 */
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

/**
 * 見本の上部ナビ（.bottom-nav を全幅のヘッダーにしたもの）。
 * ログイン状態はサーバーで判定し、未ログインは「ログイン／新規会員登録」、
 * ログイン後は「マイページ」と、ログアウト等を含む既存のアカウントメニューを出す。
 */
export async function MockSiteHeader({
  active,
  searchQuery,
  showSearch = true,
}: MockSiteHeaderProps) {
  const session = await getSessionUser();
  const signedIn = session !== null;
  const generalUser = signedIn && canUseGeneralFeatures(session.accountType);
  const showPost = !signedIn || generalUser;

  return (
    <header className="bottom-nav" data-ui="mock-site-header">
      <Link href="/" className="bn-logo">
        Farmille
      </Link>
      <nav className="bn-scroll" aria-label="メインナビ">
        <Link
          href="/search"
          className={active === "search" ? "bn-item bn-search on" : "bn-item bn-search"}
          aria-current={active === "search" ? "page" : undefined}
        >
          <SearchIcon size={21} />
          <span>資材をさがす</span>
        </Link>
        {showSearch ? (
          <Form action="/search" aria-label="ヘッダー検索" className="pc-search" role="search">
            <SearchIcon size={17} />
            <input
              // q が変わったとき（同じ画面での再送信や履歴の前後移動）に入力欄を作り直して反映する
              key={searchQuery}
              aria-label="資材を検索"
              autoComplete="off"
              defaultValue={searchQuery}
              enterKeyHint="search"
              name="q"
              placeholder="資材を検索"
              type="search"
            />
            <button className="go" type="submit">
              検索へ →
            </button>
          </Form>
        ) : null}
        {showPost ? (
          <div className="bn-post">
            <Link href="/post" className="plus" aria-label="投稿する">
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
              className={active === "me" ? "bn-item bn-mypage on" : "bn-item bn-mypage"}
              aria-current={active === "me" ? "page" : undefined}
            >
              マイページ
            </Link>
          ) : null
        ) : (
          <div className="auth-btns">
            <Link href="/login" className="a-login">
              ログイン
            </Link>
            <Link href="/signup/general" className="a-signup">
              新規会員登録
            </Link>
          </div>
        )}
      </nav>
      {signedIn ? (
        <div className="bn-account">
          <DesktopAccountMenu myPageCurrent={active === "me"} />
        </div>
      ) : null}
    </header>
  );
}
