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

/** フッターは実在する画面だけに接続し、未公開の規約はリンクにしない。 */
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
              fontWeight: "700",
              color: "text.default",
              textDecoration: "none",
            })}
          >
            Farmille
          </Link>
          <p className={css({ fontSize: "sm", color: "text.subtle", lineHeight: "relaxed" })}>
            生産者による生産者のための事例共有サイト
          </p>
          <p className={css({ fontSize: "sm", color: "text.subtle", lineHeight: "relaxed" })}>
            BS資材を作物・効果から検索し、生産者の実証詳細レポートと感想口コミを確かめられます。
          </p>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h1
              className={css({
                m: "0",
                mb: "3",
                fontSize: "sm",
                fontWeight: "700",
                color: "text.subtle",
              })}
            >
              {group.title}
            </h1>
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
          fontSize: "xs",
          color: "text.subtle",
        })}
      >
        <span>© {new Date().getFullYear()} Farmille</span>
        <div className={css({ display: "flex", flexWrap: "wrap", gap: "4" })}>
          <span>プライバシーポリシー（準備中）</span>
          <span>利用規約（準備中）</span>
        </div>
      </div>
    </footer>
  );
}
