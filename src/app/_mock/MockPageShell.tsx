import "./mock.css";
import "./mock-extra.css";
import "./chrome.css";

import type { ReactNode } from "react";

import { PreparationNotice } from "@/components/PreparationNotice";

import { MockAppBar } from "./MockAppBar";
import { MockSiteFooter } from "./MockSiteFooter";
import { type MockNavActive, MockSiteHeader } from "./MockSiteHeader";

type MockPageShellBaseProps = {
  active?: MockNavActive;
  searchQuery?: string;
  /** ヘッダーの検索バー。見本のホームだけ出さない。 */
  showHeaderSearch?: boolean;
  /** 画面下の投稿ボタン（FabBar look="mock"）がある画面。本文の下に隠れない余白をとる。 */
  hasFab?: boolean;
  /** 見本は記事フィード以外の全画面の本文末尾にフッターを足す。 */
  footer?: boolean;
  children: ReactNode;
};

/** 見本 appbar(title) の戻るバー。渡さない画面（ホーム）は戻るバーを出さない。 */
type MockPageShellProps = MockPageShellBaseProps &
  (
    | { title: string; backHref: string; shareHref?: string }
    | { title?: undefined; backHref?: undefined; shareHref?: undefined }
  );

/**
 * 完成見本の画面の外枠（.fm）。上から、ヘッダー＋戻るバー（上に固定）、準備中のお知らせ、
 * 本文（見本 .body）とフッター。見本にない画面（運営・パスワード再設定など）は使わず、
 * 既定の AppBar / FormPageShell のままにする。
 */
export function MockPageShell(props: MockPageShellProps) {
  const { active, searchQuery, showHeaderSearch = true, hasFab = false, footer = true } = props;

  return (
    <div className={hasFab ? "fm fm-page has-fab" : "fm fm-page"}>
      <div className="fm-chrome">
        <MockSiteHeader active={active} searchQuery={searchQuery} showSearch={showHeaderSearch} />
        {props.title === undefined ? null : (
          <MockAppBar title={props.title} backHref={props.backHref} shareHref={props.shareHref} />
        )}
      </div>
      <PreparationNotice look="mock" />
      <main className="body">
        {props.children}
        {footer ? <MockSiteFooter /> : null}
      </main>
    </div>
  );
}
