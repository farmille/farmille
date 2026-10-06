import Link from "next/link";

/** ぼかしの下に置く飾りの見出し。実際の本文は受け取らない。 */
const DECOY_SECTIONS = ["期待した効果", "栽培条件・施用時期", "比較した区", "使用結果の詳細"];

/**
 * 見本 S.reportArticle の未ログイン時の表示（#gateBlur／#gateOverlay）。
 * 見本は本文そのものをぼかすが、本番は会員限定の本文を受け取らないため、飾りの線をぼかす。
 */
export function ReportGate({ reportPath }: { reportPath: string }) {
  const next = encodeURIComponent(reportPath);
  return (
    <section className="rp-gate" aria-label="実証詳細レポートの続きを読む">
      <div className="rp-gate-blur" aria-hidden="true">
        {DECOY_SECTIONS.map((title) => (
          <div key={title}>
            <div className="a-h3">{title}</div>
            <div className="rp-gate-line" />
            <div className="rp-gate-line" />
            <div className="rp-gate-line short" />
          </div>
        ))}
      </div>
      <div className="rp-gate-overlay">
        <div className="card pad rp-gate-card">
          <h2>続きは無料会員登録で読めます（1分）</h2>
          <p className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
            使用結果のグラフ・比較した区の詳細が見られます
          </p>
          <Link className="btn btn-primary" href={`/signup/general?next=${next}`}>
            無料会員登録して続きを読む
          </Link>
          <div style={{ marginTop: 8 }}>
            <Link className="link-more" href={`/login?next=${next}`} style={{ fontSize: 12 }}>
              ログインはこちら →
            </Link>
          </div>
        </div>
        <div className="rp-gate-fade" />
      </div>
    </section>
  );
}
