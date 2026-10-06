import Link from "next/link";

const TABS = [
  { id: "dash", label: "ダッシュボード", href: "/dashboard" },
  { id: "profile", label: "メーカープロフィール", href: "/dashboard/profile" },
  { id: "product", label: "製品情報", href: "/dashboard/materials" },
] as const;

export type DashboardTab = (typeof TABS)[number]["id"];

/** 見本 S.makerDash 上部の切り替え（.fpill の行）。見本のタブを画面へのリンクにしたもの。 */
export function DashboardTabs({ active }: { active: DashboardTab }) {
  return (
    <nav aria-label="企業会員メニュー">
      <ul className="dash-tabs">
        {TABS.map((tab) => (
          <li key={tab.id}>
            <Link
              className={tab.id === active ? "fpill on" : "fpill"}
              href={tab.href}
              aria-current={tab.id === active ? "page" : undefined}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
