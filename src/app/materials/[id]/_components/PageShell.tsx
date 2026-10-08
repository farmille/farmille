import { FormPageShell } from "@/components/FormPageShell";

type MaterialPageShellProps = {
  title: string;
  backHref: string;
  hasFab?: boolean;
  children: React.ReactNode;
};

export function MaterialPageShell({
  title,
  backHref,
  hasFab = false,
  children,
}: MaterialPageShellProps) {
  return (
    <FormPageShell
      chrome="public"
      active="search"
      title={title}
      backHref={backHref}
      variant="material"
      hasFab={hasFab}
    >
      {children}
    </FormPageShell>
  );
}
