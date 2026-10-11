import Link from "next/link";
import { css } from "../../../styled-system/css";

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
    title: "メーカーの方",
    links: [
      { label: "メーカー掲載の流れ", href: "/sellers" },
      { label: "メーカー登録申請", href: "/sellers/apply" },
      { label: "製品情報の管理", href: "/dashboard" },
    ],
  },
];

export function HomeFooter() {
  return (
    <footer
      className={css({
        mt: "12",
        pt: "8",
        pb: "24",
        borderTopWidth: "1px",
        borderColor: "border.default",
        tab: { pb: "8" },
      })}
    >
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: "8",
          tab: { gridTemplateColumns: "1.4fr repeat(3, minmax(0, 1fr))" },
        })}
      >
        <div className={css({ gridColumn: "1 / -1", tab: { gridColumn: "auto" } })}>
          <Link
            href="/"
            className={css({
              fontSize: "xl",
              fontWeight: "bold",
              color: "text.default",
              textDecoration: "none",
            })}
          >
            Farmille
          </Link>
          <p className={css({ textStyle: "supporting", color: "text.subtle" })}>
            生産者による生産者のための事例共有サイト
          </p>
          <p className={css({ textStyle: "supporting", color: "text.subtle" })}>
            BS資材を作物・効果から検索し、生産者の実証詳細レポートと感想口コミを確かめられます。
          </p>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2
              className={css({
                m: "0",
                mb: "3",
                textStyle: "body",
                color: "text.subtle",
              })}
            >
              {group.title}
            </h2>
            <ul
              className={css({
                listStyle: "none",
                m: "0",
                p: "0",
                display: "flex",
                flexDirection: "column",
                gap: "1",
              })}
            >
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={css({ fontSize: "sm", color: "text.muted", textDecoration: "none" })}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div
        className={css({
          borderTopWidth: "1px",
          borderColor: "border.default",
          mt: "8",
          pt: "5",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "4",
          textStyle: "note",
          color: "text.subtle",
        })}
      >
        <span>© {new Date().getFullYear()} Farmille</span>
        <div className={css({ display: "flex", flexWrap: "wrap", gap: "4" })}>
          <Link href="/legal/privacy">プライバシーポリシー</Link>
          <Link href="/legal">規約・ガイドライン</Link>
          <span>お問い合わせフォーム（準備中）</span>
          <a href="mailto:contact@farmille.com">contact@farmille.com</a>
        </div>
      </div>
    </footer>
  );
}
