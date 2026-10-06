import "../_mock/forms.css";

import type { Metadata } from "next";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { AccountTypeChoice } from "@/app/signup/AccountTypeChoice";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "アカウント登録",
  description: "一般ユーザーとメーカーから、利用方法に合う登録方法を選びます。",
  robots: NO_INDEX_ROBOTS,
};

export default function SignupPage() {
  return (
    <MockPageShell title="アカウントを作成" backHref="/">
      <div className="fm-narrow">
        <h1 className="sr-only">アカウントを作成</h1>
        <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
          利用方法に合うアカウントを選んでください。
        </p>
        <AccountTypeChoice />
      </div>
    </MockPageShell>
  );
}
