import Link from "next/link";

const nowrap = { whiteSpace: "nowrap" } as const;

const methodBox = {
  border: "1px solid var(--line)",
  borderRadius: 11,
  padding: "12px 14px",
  background: "var(--card)",
} as const;

const methodList = { margin: "8px 0 0", paddingLeft: 17, fontSize: 12, lineHeight: 1.85 } as const;

const badgeBase = { fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 6 } as const;

/**
 * 見本 S.home の運営からのレター（`.letter`）と「はじめての方へ」の案内カード。
 * 見本の案内カードは応援メッセージと切り替わるカルーセルだが、応援メッセージは構想段階のサンプルなので
 * 「はじめての方へ」の1枚だけを出す。
 */
export function HomeLetter() {
  return (
    <>
      <section className="letter card" aria-labelledby="home-letter-heading">
        <div className="letter-main">
          <h3 id="home-letter-heading">
            実際に使った体験を共有し、
            <span style={nowrap}>1人で何年もかかっていた</span>
            <span style={nowrap}>試験を、1年で。</span>
          </h3>
          <p>
            資材の種類は増えていますが、自分の畑で結果が出るかどうかは、使ってみるまで分かりません。
          </p>
          <p>いちばん参考になるのは、生産者が実際に使った体験です。</p>
          <p>Farmilleで、みなさんの体験を共有して、より良い資材選びを実現しましょう。</p>
          <div className="letter-actions">
            <Link className="btn btn-primary btn-sm" href="/post?type=report">
              実証詳細レポートを投稿する
            </Link>
            <Link className="btn btn-primary btn-sm" href="/post?type=review">
              感想口コミを投稿する
            </Link>
          </div>
        </div>
      </section>
      <section
        className="card"
        style={{ marginTop: 26, padding: "26px 24px" }}
        aria-labelledby="home-guide-heading"
      >
        <span
          style={{
            background: "var(--green-soft)",
            color: "var(--green-deep)",
            fontWeight: 800,
            fontSize: 11.5,
            padding: "4px 12px",
            borderRadius: 6,
            letterSpacing: ".08em",
          }}
        >
          はじめての方へ
        </span>
        <h3 id="home-guide-heading" style={{ marginTop: 12, fontSize: 18 }}>
          実証詳細レポートと感想口コミ、2つの共有方法があります
        </h3>
        <div className="muted" style={{ marginTop: 8, fontSize: 13, lineHeight: 1.9 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 10,
              marginTop: 4,
            }}
          >
            <div style={methodBox}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ ...badgeBase, background: "var(--green)", color: "#fff" }}>
                  じっくり
                </span>
                <b style={{ color: "var(--ink)", fontSize: 13 }}>実証詳細レポート</b>
              </div>
              <ul style={methodList}>
                <li>使用区と対照区を比べた、詳しい体験の共有</li>
                <li>収量などの定量データは自動でグラフに</li>
                <li>閲覧・投稿には無料の会員登録が必要です</li>
              </ul>
            </div>
            <div style={methodBox}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    ...badgeBase,
                    background: "var(--green-soft)",
                    color: "var(--green-deep)",
                  }}
                >
                  気軽に
                </span>
                <b style={{ color: "var(--ink)", fontSize: 13 }}>感想口コミ</b>
              </div>
              <ul style={methodList}>
                <li>星5段階の評価と、ひとことの感想</li>
                <li>写真も付けられます</li>
                <li>閲覧は登録なしでどなたでも</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
