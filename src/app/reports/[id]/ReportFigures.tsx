import { OptimizedImage as Image } from "@/components/OptimizedImage";

export type ReportFigureMedia = {
  id: string;
  url: string;
  mediaType: "photo" | "video";
  caption: string | null;
};

function FigureMedia({ media, sizes }: { media: ReportFigureMedia; sizes: string }) {
  return media.mediaType === "photo" ? (
    <Image alt={media.caption ?? ""} src={media.url} width={800} height={600} sizes={sizes} />
  ) : (
    <video src={media.url} controls />
  );
}

/** 見本の `.figure`（写真1枚＋説明）。 */
export function ReportFigure({ media }: { media: ReportFigureMedia }) {
  return (
    <figure className="figure">
      <div className="fimg">
        <FigureMedia media={media} sizes="(max-width: 820px) 100vw, 790px" />
      </div>
      {media.caption ? <figcaption className="figcap">{media.caption}</figcaption> : null}
    </figure>
  );
}

/**
 * 節に添えた写真。2枚なら見本の `.fig-pair`（比較写真）、それ以外は `.figure` を縦に並べる。
 * `grid` を指定すると、枚数によらず2列で並べる（観察写真）。
 */
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
      <div className="fig-pair">
        {media.map((item) => (
          <figure key={item.id} style={{ margin: 0 }}>
            <div className="fimg">
              <FigureMedia media={item} sizes="(max-width: 820px) 50vw, 400px" />
            </div>
            {item.caption ? <figcaption className="figcap">{item.caption}</figcaption> : null}
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
