import { MockLinkRow } from "./Shelves";

/** 見本 S.mypage 末尾の「出品者向け」カードとログアウト。本番のアカウント操作（パスキー・パスワード）もここに置く。 */
export function AccountActions({ admin = false }: { admin?: boolean }) {
  return (
    <>
      <div className="sec-h">
        <h2>アカウント</h2>
      </div>
      <div className="card">
        {admin ? (
          <MockLinkRow href="/admin">
            <div className="dv">運営管理へ</div>
          </MockLinkRow>
        ) : null}
        <MockLinkRow href="/account/passkeys">
          <div className="dv">パスキーを管理</div>
        </MockLinkRow>
        <MockLinkRow href="/account/password">
          <div className="dv">パスワードを変更</div>
        </MockLinkRow>
      </div>
      {!admin ? (
        <>
          <div className="sec-h">
            <h2>出品者向け</h2>
          </div>
          <div className="card">
            <MockLinkRow href="/sellers?from=me">
              <div className="dv">企業会員登録を申請する</div>
            </MockLinkRow>
          </div>
        </>
      ) : null}
      <form action="/logout" method="post" style={{ textAlign: "center", marginTop: 18 }}>
        <button type="submit" className="ts-clear">
          ログアウト
        </button>
      </form>
    </>
  );
}
