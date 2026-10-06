import Link from "next/link";

/**
 * ログアウトとメーカー申請への導線。
 * 見出し・項目名・並びは流用前の本番（b4ef5df）どおり。見た目だけ見本の `.btn.btn-ghost` を当てる。
 */
export function AccountActions({ admin = false }: { admin?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        marginTop: 32,
        paddingBottom: 16,
      }}
    >
      {admin ? (
        <Link className="btn btn-ghost" href="/admin">
          運営管理へ
        </Link>
      ) : null}
      <Link className="btn btn-ghost" href="/account/passkeys">
        パスキーを管理
      </Link>
      <Link className="btn btn-ghost" href="/account/password">
        パスワードを変更
      </Link>
      <form action="/logout" method="post">
        <button type="submit" className="btn btn-ghost">
          ログアウト
        </button>
      </form>
      {!admin ? (
        <Link className="btn btn-ghost" href="/sellers?from=me">
          企業会員登録を申請
        </Link>
      ) : null}
    </div>
  );
}
