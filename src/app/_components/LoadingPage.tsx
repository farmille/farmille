import { FormPageShell, SurfaceCard } from "@/components";
import { css } from "../../../styled-system/css";

const skeleton = css({
  display: "grid",
  gap: "3",
});

const skeletonLine = css({
  h: "16px",
  borderRadius: "pill",
  bg: "green.soft2",
  _last: {
    w: "75%",
  },
});

type LoadingPageProps = {
  title: string;
  backHref: string;
};

export function LoadingPage({ title, backHref }: LoadingPageProps) {
  return (
    <FormPageShell chrome="public" backHref={backHref} title={title}>
      <SurfaceCard description="しばらくお待ちください。" title="読み込んでいます">
        <div aria-busy="true" aria-label="コンテンツを読み込んでいます" className={skeleton}>
          <span className={skeletonLine} />
          <span className={skeletonLine} />
          <span className={skeletonLine} />
        </div>
      </SurfaceCard>
    </FormPageShell>
  );
}
