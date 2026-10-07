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
    title: "メーカー・団体の方",
    links: [
      { label: "メーカーの方へ", href: "/sellers" },
      { label: "企業会員登録申請", href: "/sellers/apply" },
      { label: "よくあるご質問・各種お手続き", href: "/sellers/procedures" },
      { label: "製品情報の管理", href: "/dashboard" },
    ],
  },
];

const footer = css({
  mt: "9",
  pt: "7",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  "& a": { textDecoration: "none" },
  tab: { mt: "14", pt: "10" },
});

const grid = css({
  display: "flex",
  flexDirection: "column",
  gap: "5.5",
  tab: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))",
    rowGap: "6",
    columnGap: "10",
  },
});

const brandLink = css({ color: "text.default", fontSize: "lg", fontWeight: "bold" });

const tagline = css({
  mt: "2",
  color: "text.subtle",
  fontSize: "xs",
  letterSpacing: "0.06em",
  lineHeight: "prose",
});

const description = css({ mt: "2.5", color: "text.subtle", fontSize: "xs", lineHeight: "prose" });

const columnTitle = css({
  m: "0",
  mb: "2.5",
  color: "text.subtle",
  fontSize: "xs",
  fontWeight: "extrabold",
  letterSpacing: "0.1em",
});

const columnList = css({ listStyle: "none", m: "0", p: "0" });

const columnLink = css({
  display: "block",
  py: "1",
  color: "text.muted",
  fontSize: "sm",
  _hover: { color: "primary.800" },
});

const bottom = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: "3",
  mt: "6",
  pt: "4",
  pb: "1",
  borderTopWidth: "1px",
  borderTopStyle: "solid",
  borderTopColor: "border.default",
  color: "text.subtle",
  fontSize: "xs",
});

const legal = css({
  display: "flex",
  flexWrap: "wrap",
  columnGap: "4.5",
  rowGap: "1.5",
  "& a": { color: "text.subtle", _hover: { color: "primary.800" } },
});

export function SiteFooter() {
  return (
    <footer className={footer}>
      <div className={grid}>
        <div>
          <Link href="/" className={brandLink}>
            Farmille
          </Link>
          <div className={tagline}>
            生産者による生産者のための
            <br />
            事例共有サイト
          </div>
          <p className={description}>
            BS資材を作物・効果から検索し、生産者の実証詳細レポートと感想口コミを確かめられます。
          </p>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h5 className={columnTitle}>{group.title}</h5>
            <ul className={columnList}>
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={columnLink}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={bottom}>
        <span>© {new Date().getFullYear()} Farmille</span>
        <span className={legal}>
          <Link href="/legal/disclaimer">免責事項</Link>
          <Link href="/legal/privacy">プライバシーポリシー</Link>
          <Link href="/legal">規約・ガイドライン</Link>
          <span>お問い合わせフォーム（準備中）</span>
          <a href="mailto:contact@farmille.com">contact@farmille.com</a>
        </span>
      </div>
    </footer>
  );
}
