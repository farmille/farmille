import Link from "next/link";

import { TextLink } from "@/components/TextLink";
import { css, cva } from "../../../styled-system/css";

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

export type FooterTone = "plain" | "forest";

/** plain は通常の画面の地、forest はホームの深い緑の帯の上に置く。 */
const footer = cva({
  base: { mt: "12", pt: "8", pb: "24", tab: { pb: "8" } },
  variants: {
    tone: {
      plain: { borderTopWidth: "1px", borderColor: "border.default" },
      forest: { mt: "0", pt: "0" },
    },
  },
});

const brand = cva({
  base: { fontSize: "xl", fontWeight: "bold", textDecoration: "none" },
  variants: { tone: { plain: { color: "text.default" }, forest: { color: "text.inverse" } } },
});

const description = cva({
  base: { textStyle: "supporting" },
  variants: { tone: { plain: { color: "text.subtle" }, forest: { color: "text.inverse" } } },
});

const groupTitle = cva({
  base: { m: "0", mb: "3", textStyle: "body" },
  variants: { tone: { plain: { color: "text.subtle" }, forest: { color: "text.inverse" } } },
});

/** リンクの色と大きさは一覧に持たせ、TextLink の nav がそれを受け継ぐ。 */
const linkList = cva({
  base: {
    listStyle: "none",
    m: "0",
    p: "0",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "1",
    fontSize: "sm",
  },
  variants: { tone: { plain: { color: "text.muted" }, forest: { color: "text.inverse" } } },
});

const legal = cva({
  base: {
    borderTopWidth: "1px",
    mt: "8",
    pt: "5",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "4",
    textStyle: "note",
  },
  variants: {
    tone: {
      plain: { borderColor: "border.default", color: "text.subtle" },
      forest: { borderColor: "primary.700", color: "text.inverse" },
    },
  },
});

export function HomeFooter({ tone = "plain" }: { tone?: FooterTone }) {
  return (
    <footer className={footer({ tone })}>
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: "8",
          tab: { gridTemplateColumns: "1.4fr repeat(3, minmax(0, 1fr))" },
        })}
      >
        <div className={css({ gridColumn: "1 / -1", tab: { gridColumn: "auto" } })}>
          <Link href="/" className={brand({ tone })}>
            Farmille
          </Link>
          <p className={description({ tone })}>生産者による生産者のための事例共有サイト</p>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className={groupTitle({ tone })}>{group.title}</h2>
            <ul className={linkList({ tone })}>
              {group.links.map((item) => (
                <li key={item.href}>
                  <TextLink href={item.href} variant="nav">
                    {item.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className={legal({ tone })}>
        <span>© {new Date().getFullYear()} Farmille</span>
        <div className={css({ display: "flex", flexWrap: "wrap", gap: "4" })}>
          <TextLink href="/legal/privacy" variant="nav">
            プライバシーポリシー
          </TextLink>
          <TextLink href="/legal" variant="nav">
            規約・ガイドライン
          </TextLink>
          <span>お問い合わせフォーム（準備中）</span>
          <TextLink href="mailto:contact@farmille.com" variant="nav">
            contact@farmille.com
          </TextLink>
        </div>
      </div>
    </footer>
  );
}
