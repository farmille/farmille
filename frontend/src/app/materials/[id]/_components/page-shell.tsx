import { FormPageShell } from "@/components/form-page-shell";

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
    <FormPageShell title={title} backHref={backHref} variant="material" hasFab={hasFab}>
      {children}
    </FormPageShell>
  );
}
