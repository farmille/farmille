import Link from "next/link";

import { TextLink } from "@/components/TextLink";
import { css } from "../../../styled-system/css";
import { HomeHills } from "./HomeHills";

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
      { label: "企業会員登録の申請", href: "/sellers/apply" },
      { label: "製品情報の管理", href: "/dashboard" },
    ],
  },
];

/** 画面下に固定したバー（下部ナビ・FAB・レポート入力の送信帯）の高さ。フッターの末尾がその下に隠れないよう空ける。 */
const bottomBarRoom = "[calc({spacing.16} + env(safe-area-inset-bottom, 0px) + {spacing.8})]";

/** 丘を帯の上端に 1px 重ね、質感の継ぎ目を帯の上端にそろえる。 */
const hills = css({ mb: "[-1px]" });

/**
 * 帯は丘より手前に描き、重なった 1px を覆う。上の中身の高さに端数が出ると、丘の下端の切り口が
 * 画素の途中にかかり、奥の層がその1行だけ明るい線として透けるため。
 */
const band = css({
  position: "relative",
  bgColor: "surface.forest",
  layerStyle: "wash",
  pt: "10",
  pb: bottomBarRoom,
  tab: { pt: "12", pb: "8" },
  // レポート入力の送信帯と、資材・レポート詳細の FAB は PC でも画面下に固定される
  "body:has([data-ui=report-form-bar]) &": { tab: { pb: bottomBarRoom } },
  "body:has([data-ui=responsive-fab-bar]) &": { tab: { pb: bottomBarRoom } },
});

const inner = css({ maxW: "content.wide", mx: "auto", px: "5", tab: { px: "8" } });

const brand = css({
  fontSize: "xl",
  fontWeight: "bold",
  color: "text.inverse",
  textDecoration: "none",
});

const description = css({ textStyle: "supporting", color: "text.inverse" });

const groupTitle = css({ m: "0", mb: "3", textStyle: "body", color: "text.inverse" });

/** リンクの色と大きさは一覧に持たせ、TextLink の nav がそれを受け継ぐ。 */
const linkList = css({
  listStyle: "none",
  m: "0",
  p: "0",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "1",
  fontSize: "sm",
  color: "text.inverse",
});

const legal = css({
  borderTopWidth: "1px",
  borderColor: "primary.700",
  mt: "8",
  pt: "5",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  gap: "4",
  textStyle: "note",
  color: "text.inverse",
});

/** 全画面の末尾に置くフッター。丘の稜線から深い緑の帯へつなぐ。 */
export function SiteFooter() {
  return (
    <footer>
      <HomeHills className={hills} into="forest" sprouts />
      <div className={band}>
        <div className={inner}>
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: "8",
              tab: { gridTemplateColumns: "1.4fr repeat(3, minmax(0, 1fr))" },
            })}
          >
            <div className={css({ gridColumn: "1 / -1", tab: { gridColumn: "auto" } })}>
              <Link href="/" className={brand}>
                Farmille
              </Link>
              <p className={description}>生産者による生産者のための事例共有サイト</p>
            </div>
            {groups.map((group) => (
              <nav key={group.title} aria-label={group.title}>
                <h2 className={groupTitle}>{group.title}</h2>
                <ul className={linkList}>
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
          <div className={legal}>
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
        </div>
      </div>
    </footer>
  );
}
