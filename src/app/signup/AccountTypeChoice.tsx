import Link from "next/link";

/*
 * 一般ユーザーとメーカーを入力前に分け、異なる確認・ログイン方式を明示する。
 * 見本には選ぶ画面がない（S.signup の下に「メーカー様はこちら」がある）ため、
 * S.signup の部品（緑の案内カード・.card.pad・.btn・.link-more）で組んでいる。
 */
export function AccountTypeChoice() {
  return (
    <>
      <div className="stack">
        <section
          className="card pad"
          aria-labelledby="signup-general-title"
          style={{
            background: "var(--green-soft-2)",
            border: "1px solid color-mix(in srgb, var(--green) 22%, var(--line))",
          }}
        >
          <span className="type-label">個人用アカウント</span>
          <h2 id="signup-general-title" style={{ fontSize: 15, marginTop: 8 }}>
            一般ユーザーとして登録
          </h2>
          <p style={{ fontSize: 12.5, marginTop: 4, color: "var(--ink-2)", lineHeight: 1.65 }}>
            ニックネームで、感想口コミや実証詳細レポートを投稿できます。
          </p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
            メールアドレスで登録します。運営による確認はありません。
          </p>
          <div className="form-actions" style={{ marginTop: 12 }}>
            <Link className="btn btn-primary" href="/signup/general">
              一般ユーザー登録へ
            </Link>
          </div>
        </section>

        <section className="card pad" aria-labelledby="signup-seller-title">
          <span className="type-label" style={{ background: "var(--bg)", color: "var(--ink-2)" }}>
            メーカー用アカウント
          </span>
          <h2 id="signup-seller-title" style={{ fontSize: 15, marginTop: 8 }}>
            メーカーとして申請
          </h2>
          <p style={{ fontSize: 12.5, marginTop: 4, color: "var(--ink-2)", lineHeight: 1.65 }}>
            自社の農業資材情報や記事を管理する、メーカー専用アカウントです。
          </p>
          <p className="muted" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.6 }}>
            ログインIDを申請します。運営の確認後にログイン情報を発行します。
          </p>
          <div className="form-actions" style={{ marginTop: 12 }}>
            <Link className="btn btn-ghost" href="/sellers">
              メーカー向けページへ
            </Link>
          </div>
        </section>
      </div>

      <div className="fguide" style={{ textAlign: "center", marginTop: 18, lineHeight: 2 }}>
        <Link className="text-link" href="/login">
          一般ユーザーの方はログイン
        </Link>
        <br />
        <Link className="text-link" href="/sellers/login">
          メーカーの方はログイン
        </Link>
      </div>
    </>
  );
}
