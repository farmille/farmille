import Link from "next/link";

/**
 * 見本 S.home の会員登録の案内（`.signup-cta`）とメーカー向けの帯（`.maker-band`）。
 * 会員登録の案内はログインしていないときだけ出す。
 */
export function HomeInvitations({ showSignup }: { showSignup: boolean }) {
  return (
    <>
      {showSignup ? (
        <section className="signup-cta" aria-labelledby="signup-invitation-title">
          <h2 id="signup-invitation-title">会員登録して、あなたの体験を共有してください</h2>
          <p>
            <span style={{ color: "var(--green-deep)", fontWeight: 800 }}>
              登録は無料で、1分で完了します。
            </span>
            検索と感想口コミの閲覧は、登録なしで利用できます。
            <br />
            会員登録すると、実証詳細レポートの閲覧・投稿、感想口コミの投稿、お気に入りの保存ができます。
          </p>
          <div className="sc-actions">
            <Link
              className="btn btn-primary"
              href="/signup/general"
              style={{ width: "auto", padding: "13px 30px" }}
            >
              無料で会員登録
            </Link>
            <Link className="link-more" href="/search" style={{ fontSize: 13.5 }}>
              資材をさがす <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      ) : null}
      <section
        className="maker-band"
        aria-labelledby="manufacturer-invitation-title"
        style={showSignup ? undefined : { marginTop: 34 }}
      >
        <div>
          <h3 id="manufacturer-invitation-title">バイオスティミュラント・関連資材メーカー様へ</h3>
          <p>
            資材ページの編集権を確認後、製品情報をメーカーご自身で更新できます。
            <br />
            下書きとプレビューを用意し、公開前に運営が表現を確認します。
            <br />
            生産者が資材を比較するために、詳細な情報を掲載してください。
          </p>
        </div>
        <Link className="btn btn-primary btn-sm mb-btn" href="/sellers">
          メーカー様はこちら <span aria-hidden="true">→</span>
        </Link>
      </section>
    </>
  );
}
