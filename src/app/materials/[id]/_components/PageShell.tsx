import type { ReactNode } from "react";

import { MockPageShell } from "@/app/_mock/MockPageShell";

type MaterialPageShellProps = {
  title: string;
  backHref: string;
  hasFab?: boolean;
  children: ReactNode;
};

/**
 * 資材ページの読み込み中・見つからないときの外枠。表示後の資材ページ（page.tsx）と同じ見本の外枠を使い、
 * 読み込みから表示へ切り替わるときにヘッダーや戻るバーが入れ替わらないようにする。
 */
export function MaterialPageShell({
  title,
  backHref,
  hasFab = false,
  children,
}: MaterialPageShellProps) {
  return (
    <MockPageShell title={title} backHref={backHref} hasFab={hasFab}>
      {children}
    </MockPageShell>
  );
}
