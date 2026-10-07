import type { ReactNode } from "react";

import { SitePageShell } from "@/app/_site/SitePageShell";

type MaterialPageShellProps = {
  title: string;
  backHref: string;
  hasFab?: boolean;
  children: ReactNode;
};

export function MaterialPageShell({
  title,
  backHref,
  hasFab = false,
  children,
}: MaterialPageShellProps) {
  return (
    <SitePageShell title={title} backHref={backHref} hasFab={hasFab}>
      {children}
    </SitePageShell>
  );
}
