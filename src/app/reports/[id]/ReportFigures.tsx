import { OptimizedImage as Image } from "@/components/OptimizedImage";

import { css } from "../../../../styled-system/css";
import { figureFrameRecipe } from "../../articles/_components/Reading";

export type ReportFigureMedia = {
  id: string;
  url: string;
  mediaType: "photo" | "video";
  caption: string | null;
};

const captionStyle = css({ mt: "1.5", fontSize: "sm", color: "text.subtle", lineHeight: "normal" });

function FigureMedia({ media, sizes }: { media: ReportFigureMedia; sizes: string }) {
  return media.mediaType === "photo" ? (
    <Image alt={media.caption ?? ""} src={media.url} width={800} height={600} sizes={sizes} />
  ) : (
    <video src={media.url} controls />
  );
}

export function ReportFigure({ media }: { media: ReportFigureMedia }) {
  return (
    <figure className={css({ m: "0", mt: "3.5" })}>
      <div className={figureFrameRecipe({ ratio: "landscape" })}>
        <FigureMedia media={media} sizes="(max-width: 800px) 100vw, 768px" />
      </div>
      {media.caption ? <figcaption className={captionStyle}>{media.caption}</figcaption> : null}
    </figure>
  );
}

export function ReportFigures({
  media,
  grid = false,
}: {
  media: ReportFigureMedia[];
  grid?: boolean;
}) {
  if (media.length === 0) return null;
  if (grid || media.length === 2) {
    return (
      <div
        className={css({
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "2",
          mt: "3",
        })}
      >
        {media.map((item) => (
          <figure key={item.id} className={css({ m: "0" })}>
            <div className={figureFrameRecipe({ ratio: "portrait" })}>
              <FigureMedia media={item} sizes="(max-width: 800px) 50vw, 384px" />
            </div>
            {item.caption ? <figcaption className={captionStyle}>{item.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    );
  }
  return (
    <>
      {media.map((item) => (
        <ReportFigure key={item.id} media={item} />
      ))}
    </>
  );
}
