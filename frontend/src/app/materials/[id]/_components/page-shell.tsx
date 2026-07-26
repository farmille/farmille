import { cva, css } from "../../../../../styled-system/css";

import { AppBar } from "@/components";

const shellRecipe = cva({
  base: {
    minH: "100dvh",
    maxW: "md",
    mx: "auto",
    bg: "surface.panel",
    position: "relative",
  },
  variants: {
    hasFab: {
      true: { pb: "24" },
      false: { pb: "6" },
    },
  },
  defaultVariants: {
    hasFab: false,
  },
});

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
    <div className={shellRecipe({ hasFab })}>
      <AppBar title={title} backHref={backHref} />
      <main className={css({ px: "3.5", py: "4" })}>{children}</main>
    </div>
  );
}
