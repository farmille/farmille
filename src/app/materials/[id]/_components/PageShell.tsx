import type { AppBarAccount } from "@/components/AppBar";
import { FormPageShell } from "@/components/FormPageShell";

type MaterialPageShellProps = {
  title: string;
  backHref: string;
  hasFab?: boolean;
  account?: AppBarAccount;
  children: React.ReactNode;
};

export function MaterialPageShell({
  title,
  backHref,
  hasFab = false,
  account,
  children,
}: MaterialPageShellProps) {
  return (
    <FormPageShell
      chrome="public"
      active="search"
      account={account}
      title={title}
      backHref={backHref}
      variant="material"
      hasFab={hasFab}
    >
      {children}
    </FormPageShell>
  );
}
