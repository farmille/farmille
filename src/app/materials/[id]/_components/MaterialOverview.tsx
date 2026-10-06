import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";

/** 見本 S.material の boxDesc（製品説明）。未記入は「−」。 */
export function MaterialDescriptionBox({ description }: { description: string | undefined }) {
  return (
    <section aria-labelledby="material-description-heading">
      <h2 id="material-description-heading" className="pp-h">
        製品説明
      </h2>
      <div className="card pad">
        {description ? (
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.8,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
            }}
          >
            {description}
          </p>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>
            −
          </p>
        )}
      </div>
    </section>
  );
}

/** 見本 S.material の boxTiming（8段階のタイムライン）。未記入は「−」。 */
export function MaterialTimingBox({ timings }: { timings: readonly number[] }) {
  return (
    <section aria-labelledby="material-timing-heading">
      <h2 id="material-timing-heading" className="pp-h">
        施用タイミング
      </h2>
      <div className="card pad">
        {timings.length > 0 ? (
          <>
            <div className="tl-wrap">
              <ol className="tl" style={{ listStyle: "none", margin: 0 }}>
                {APPLICATION_TIMINGS.map((stage, index) => {
                  const on = timings.includes(index);
                  return (
                    <li key={stage} className={on ? "tl-i on" : "tl-i"}>
                      <span className="dot" />
                      <span className="lb">
                        {stage}
                        {on ? <span className="sr-only">（施用時期）</span> : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="disclaimer">作物ごとには分けず、共通の目安として表示します。</div>
          </>
        ) : (
          <p className="muted" style={{ fontSize: 13 }}>
            −
          </p>
        )}
      </div>
    </section>
  );
}
