import "../_mock/forms.css";

import type { Metadata } from "next";

import { MockPageShell } from "@/app/_mock/MockPageShell";
import { AccountTypeChoice } from "@/app/signup/AccountTypeChoice";
import { NO_INDEX_ROBOTS } from "@/lib/seo";

import { css } from "../../../styled-system/css";

export const metadata: Metadata = {
  title: "アカウント登録",
  description: "一般ユーザーとメーカーから、利用方法に合う登録方法を選びます。",
  robots: NO_INDEX_ROBOTS,
};

export default function SignupPage() {
  return (
    <MockPageShell title="アカウントを作成" backHref="/">
      <div className={css({ maxW: "content.reading", mx: "auto" })}>
        <h1 className={css({ srOnly: true })}>アカウントを作成</h1>
        <p className={css({ mb: "3.5", fontSize: "sm", color: "text.subtle" })}>
          利用方法に合うアカウントを選んでください。
        </p>
        <AccountTypeChoice />
      </div>
    </MockPageShell>
  );
}
