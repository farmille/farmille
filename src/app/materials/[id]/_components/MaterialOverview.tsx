import { surfaceCardRecipe } from "@/components/SurfaceCard";
import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";

import { css, cva } from "../../../../../styled-system/css";

import { MaterialBox } from "./MaterialBox";

const descriptionStyle = css({
  textStyle: "prose",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
});
const emptyStyle = css({ textStyle: "body", color: "text.subtle" });
const timelineScrollStyle = css({
  mt: "0.5",
  mx: "-1",
  overflowX: "auto",
  scrollbarWidth: "none",
  "&::-webkit-scrollbar": { display: "none" },
});
const timelineStyle = css({
  position: "relative",
  display: "flex",
  minW: "min-content",
  m: "0",
  pt: "1.5",
  px: "1",
  pb: "0.5",
  listStyle: "none",
  _before: {
    content: '""',
    position: "absolute",
    top: "3",
    left: "6",
    right: "6",
    h: "0.5",
    bg: "text.default",
  },
});
const stageStyle = css({ position: "relative", flex: "1", minW: "20", textAlign: "center" });
const dotRecipe = cva({
  base: {
    position: "relative",
    zIndex: "1",
    display: "block",
    w: "3",
    h: "3",
    mx: "auto",
    borderWidth: "2px",
    borderRadius: "pill",
  },
  variants: {
    on: {
      true: { bg: "primary.700", borderColor: "primary.700" },
      false: { bg: "surface.card", borderColor: "text.default" },
    },
  },
});
const labelRecipe = cva({
  base: {
    display: "block",
    mt: "2",
    fontSize: "2xs",
    lineHeight: "snug",
    letterSpacing: "body",
  },
  variants: {
    on: {
      true: { color: "primary.800", fontWeight: "bold" },
      false: { color: "text.subtle" },
    },
  },
});
const visuallyHiddenStyle = css({ srOnly: true });
const noteStyle = css({ mt: "2.5", textStyle: "note", color: "text.subtle" });

export function MaterialDescriptionBox({ description }: { description: string | undefined }) {
  return (
    <MaterialBox headingId="material-description-heading" title="製品説明">
      <div className={surfaceCardRecipe()}>
        {description ? (
          <p className={descriptionStyle}>{description}</p>
        ) : (
          <p className={emptyStyle}>−</p>
        )}
      </div>
    </MaterialBox>
  );
}

export function MaterialTimingBox({ timings }: { timings: readonly number[] }) {
  return (
    <MaterialBox headingId="material-timing-heading" title="施用タイミング">
      <div className={surfaceCardRecipe()}>
        {timings.length > 0 ? (
          <>
            <div className={timelineScrollStyle}>
              <ol className={timelineStyle}>
                {APPLICATION_TIMINGS.map((stage, index) => {
                  const on = timings.includes(index);
                  return (
                    <li key={stage} className={stageStyle}>
                      <span className={dotRecipe({ on })} />
                      <span className={labelRecipe({ on })}>
                        {stage}
                        {on ? <span className={visuallyHiddenStyle}>（施用時期）</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className={noteStyle}>作物ごとには分けず、共通の目安として表示します。</div>
          </>
        ) : (
          <p className={emptyStyle}>−</p>
        )}
      </div>
    </MaterialBox>
  );
}
