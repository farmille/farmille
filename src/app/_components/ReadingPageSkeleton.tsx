import { AppBar } from "@/components";
import { ReadingSkeleton } from "@/components/Skeleton";
import { css } from "../../../styled-system/css";

export function ReadingPageSkeleton({
  title,
  variant = "article",
}: {
  title: string;
  variant?: "article" | "report";
}) {
  return (
    <div className={css({ minH: "100dvh", bg: "surface.page", pb: "6" })}>
      <AppBar chrome="public" active="articles" title={title} backHref="/articles" />
      <main
        className={css({
          w: "100%",
          maxW: "content.reading",
          mx: "auto",
          px: "3.5",
          py: "4",
          bg: "surface.panel",
          tab: { px: "6", py: "6" },
        })}
      >
        <ReadingSkeleton variant={variant} />
      </main>
    </div>
  );
}
