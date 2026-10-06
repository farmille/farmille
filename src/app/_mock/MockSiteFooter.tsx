import Link from "next/link";

// 見本 .site-footer の段組みに、本番に実在する画面だけを並べる（見本の「（見本）」の項目と、
// 本番に画面がない「よくあるご質問」「メーカー掲載の流れ」は載せない）。
const groups = [
  { title: "さがす", links: [{ label: "BS資材検索", href: "/search" }] },
  {
    title: "参加する",
    links: [
      { label: "新規会員登録", href: "/signup/general" },
      { label: "実証詳細レポートを投稿", href: "/post?type=report" },
      { label: "マイページ", href: "/me" },
    ],
  },
  {
    title: "メーカー・団体の方",
    links: [
      { label: "メーカーの方へ", href: "/sellers" },
      { label: "企業会員登録申請", href: "/sellers/apply" },
      { label: "よくあるご質問・各種お手続き", href: "/sellers/procedures" },
      { label: "製品情報の管理", href: "/dashboard" },
    ],
  },
];

/** 見本の全画面共通フッター（ホームのサイトマップ）。 */
export function MockSiteFooter() {
  return (
    <footer className="site-footer" data-ui="mock-site-footer">
      <div className="sf-grid">
        <div className="sf-brand">
          <Link href="/">
            <b>Farmille</b>
          </Link>
          <div className="muted sf-tagline">
            生産者による生産者のための
            <br />
            事例共有サイト
          </div>
          <p className="muted sf-desc">
            BS資材を作物・効果から検索し、生産者の実証詳細レポートと感想口コミを確かめられます。
          </p>
        </div>
        {groups.map((group) => (
          <nav key={group.title} className="sf-col" aria-label={group.title}>
            <h5>{group.title}</h5>
            <ul>
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="sf-bottom">
        <span>© {new Date().getFullYear()} Farmille</span>
        <span className="sf-legal">
          <Link href="/legal/disclaimer">免責事項</Link>
          <Link href="/legal/privacy">プライバシーポリシー</Link>
          <Link href="/legal">規約・ガイドライン</Link>
          <span className="dis">お問い合わせフォーム（準備中）</span>
          <a href="mailto:contact@farmille.com">contact@farmille.com</a>
        </span>
      </div>
    </footer>
  );
}
