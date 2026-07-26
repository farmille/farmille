import { notFound } from "next/navigation";
import { css } from "../../../../styled-system/css";

type Swatch = {
  token: string;
  value: string;
  /** 静的抽出されるよう、各見本でリテラルの css() を渡す */
  paintClass: string;
};

// 表示用の実値ラベル。色面のクラスは下でリテラル token 参照として生成する。
const colorSwatches: Swatch[] = [
  {
    token: "green",
    value: "#2E7D32",
    paintClass: css({
      bg: "green",
      color: "card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "green.deep",
    value: "#1B5E20",
    paintClass: css({
      bg: "green.deep",
      color: "card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "green.soft",
    value: "#E8F5E9",
    paintClass: css({
      bg: "green.soft",
      color: "green.deep",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "green.soft2",
    value: "#F1F8F2",
    paintClass: css({
      bg: "green.soft2",
      color: "ink",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "blue",
    value: "#1976D2",
    paintClass: css({
      bg: "blue",
      color: "card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "star",
    value: "#F5A623",
    paintClass: css({
      bg: "star",
      color: "ink",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "amber",
    value: "#B26A00",
    paintClass: css({
      bg: "amber",
      color: "card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "amber.soft",
    value: "#FFF4E0",
    paintClass: css({
      bg: "amber.soft",
      color: "amber",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "bg",
    value: "#F5F4EF",
    paintClass: css({
      bg: "bg",
      color: "ink",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "panel",
    value: "#FAFAF7",
    paintClass: css({
      bg: "panel",
      color: "ink",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "card",
    value: "#FFFFFF",
    paintClass: css({
      bg: "card",
      color: "ink",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "ink",
    value: "#1E231F",
    paintClass: css({
      bg: "ink",
      color: "card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "ink2",
    value: "#4C534D",
    paintClass: css({
      bg: "ink2",
      color: "card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "ink3",
    value: "#7C837D",
    paintClass: css({
      bg: "ink3",
      color: "card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "line",
    value: "#E7E5DE",
    paintClass: css({
      bg: "line",
      color: "ink",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "line.strong",
    value: "#D8D6CD",
    paintClass: css({
      bg: "line.strong",
      color: "ink",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
];

const semanticSwatches: Swatch[] = [
  {
    token: "brand.primary",
    value: "→ green",
    paintClass: css({
      bg: "brand.primary",
      color: "surface.card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "brand.primaryDeep",
    value: "→ green.deep",
    paintClass: css({
      bg: "brand.primaryDeep",
      color: "surface.card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "brand.soft",
    value: "→ green.soft",
    paintClass: css({
      bg: "brand.soft",
      color: "brand.primaryDeep",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "text.default",
    value: "→ ink",
    paintClass: css({
      bg: "text.default",
      color: "surface.card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "text.muted",
    value: "→ ink2",
    paintClass: css({
      bg: "text.muted",
      color: "surface.card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "text.subtle",
    value: "→ ink3",
    paintClass: css({
      bg: "text.subtle",
      color: "surface.card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "surface.page",
    value: "→ bg",
    paintClass: css({
      bg: "surface.page",
      color: "text.default",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "surface.panel",
    value: "→ panel",
    paintClass: css({
      bg: "surface.panel",
      color: "text.default",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "surface.card",
    value: "→ card",
    paintClass: css({
      bg: "surface.card",
      color: "text.default",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "border.default",
    value: "→ line",
    paintClass: css({
      bg: "border.default",
      color: "text.default",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "border.strong",
    value: "→ line.strong",
    paintClass: css({
      bg: "border.strong",
      color: "text.default",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "accent.official",
    value: "→ blue",
    paintClass: css({
      bg: "accent.official",
      color: "surface.card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "accent.star",
    value: "→ star",
    paintClass: css({
      bg: "accent.star",
      color: "text.default",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
  {
    token: "accent.warn",
    value: "→ amber",
    paintClass: css({
      bg: "accent.warn",
      color: "surface.card",
      h: "56px",
      display: "flex",
      alignItems: "flex-end",
      px: "2.5",
      py: "2",
      fontSize: "2xs",
      fontWeight: "700",
    }),
  },
];

const page = css({
  minH: "100vh",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
  px: "4",
  py: "6",
  maxW: "480px",
  mx: "auto",
});

const section = css({ mt: "8" });

const sectionTitle = css({
  fontSize: "lg",
  fontWeight: "700",
  mb: "3",
  color: "text.default",
});

const sectionLead = css({
  fontSize: "sm",
  color: "text.muted",
  mb: "4",
  lineHeight: "1.6",
});

const grid = css({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "2.5",
});

const swatchCard = css({
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  overflow: "hidden",
  bg: "surface.card",
  boxShadow: "shadow",
});

const swatchMeta = css({
  px: "2.5",
  py: "2",
  fontSize: "2xs",
  color: "text.subtle",
  lineHeight: "1.45",
});

const swatchName = css({
  display: "block",
  color: "text.default",
  fontWeight: "700",
  fontSize: "xs",
  mb: "0.5",
});

const typeRow = css({
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: "3",
  py: "2.5",
  borderBottomWidth: "1px",
  borderBottomColor: "border.default",
});

const typeMeta = css({
  fontSize: "2xs",
  color: "text.subtle",
  flexShrink: 0,
  fontVariantNumeric: "tabular-nums",
});

const radiusRow = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  py: "3",
  borderBottomWidth: "1px",
  borderBottomColor: "border.default",
});

const samples = css({
  display: "flex",
  flexDirection: "column",
  gap: "3",
});

const chip = css({
  display: "inline-flex",
  alignItems: "center",
  alignSelf: "flex-start",
  fontSize: "xs",
  px: "2.5",
  py: "0.5",
  borderRadius: "pill",
  bg: "brand.soft",
  color: "brand.primaryDeep",
  fontWeight: "600",
});

const sampleCard = css({
  bg: "surface.card",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  boxShadow: "shadow",
  p: "4",
});

const sampleCardTitle = css({
  fontSize: "md",
  fontWeight: "700",
  mb: "1",
});

const sampleCardBody = css({
  fontSize: "sm",
  color: "text.muted",
  lineHeight: "1.65",
});

const btnPrimary = css({
  display: "block",
  w: "100%",
  borderRadius: "button",
  px: "4",
  py: "3",
  fontSize: "md",
  fontWeight: "700",
  bg: "brand.primary",
  color: "surface.card",
  borderWidth: "1px",
  borderColor: "transparent",
  textAlign: "center",
});

const btnGhost = css({
  display: "block",
  w: "100%",
  borderRadius: "button",
  px: "4",
  py: "3",
  fontSize: "md",
  fontWeight: "700",
  bg: "surface.card",
  color: "brand.primary",
  borderWidth: "1px",
  borderColor: "border.strong",
  textAlign: "center",
});

const warnBanner = css({
  mt: "3",
  p: "3",
  borderRadius: "input",
  bg: "amber.soft",
  color: "accent.warn",
  fontSize: "sm",
  fontWeight: "600",
  borderWidth: "1px",
  borderColor: "accent.warn",
});

const official = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1",
  color: "accent.official",
  fontSize: "sm",
  fontWeight: "600",
  mt: "2",
});

const starRow = css({
  color: "accent.star",
  fontSize: "sm",
  letterSpacing: "1px",
  mt: "2",
});

function SwatchGrid({ items }: { items: Swatch[] }) {
  return (
    <div className={grid}>
      {items.map((item) => (
        <div key={item.token} className={swatchCard}>
          <div className={item.paintClass}>{item.value}</div>
          <div className={swatchMeta}>
            <span className={swatchName}>{item.token}</span>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TokensPage() {
  // 本番ビルド／実行では 404（T-03: 本番から除外）
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className={page}>
      <h1 className={css({ fontSize: "3xl", fontWeight: "800", letterSpacing: "0.01em" })}>
        Design Tokens
      </h1>
      <p className={css({ fontSize: "sm", color: "text.muted", mt: "2", lineHeight: "1.6" })}>
        docs/rebuild/02-screens.md §5 準拠（ライトのみ）。/dev/tokens は開発時専用。
      </p>

      <section className={section}>
        <h2 className={sectionTitle}>Colors</h2>
        <p className={sectionLead}>生トークン（colors.*）。色面はトークン参照、ラベルは実値。</p>
        <SwatchGrid items={colorSwatches} />
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>Semantic Colors</h2>
        <p className={sectionLead}>brand / text / surface / border / accent。</p>
        <SwatchGrid items={semanticSwatches} />
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>Typography</h2>
        <p className={sectionLead}>fontSizes 8段（2xs〜3xl）＋ fonts.sans。</p>
        <div className={typeRow}>
          <span className={css({ fontSize: "2xs", color: "text.default", fontWeight: "600" })}>
            あいう農資材 2xs
          </span>
          <span className={typeMeta}>2xs · 9.5px</span>
        </div>
        <div className={typeRow}>
          <span className={css({ fontSize: "xs", color: "text.default", fontWeight: "600" })}>
            あいう農資材 xs
          </span>
          <span className={typeMeta}>xs · 11px</span>
        </div>
        <div className={typeRow}>
          <span className={css({ fontSize: "sm", color: "text.default", fontWeight: "600" })}>
            あいう農資材 sm
          </span>
          <span className={typeMeta}>sm · 12px</span>
        </div>
        <div className={typeRow}>
          <span className={css({ fontSize: "md", color: "text.default", fontWeight: "600" })}>
            あいう農資材 md
          </span>
          <span className={typeMeta}>md · 14px</span>
        </div>
        <div className={typeRow}>
          <span className={css({ fontSize: "lg", color: "text.default", fontWeight: "600" })}>
            あいう農資材 lg
          </span>
          <span className={typeMeta}>lg · 16px</span>
        </div>
        <div className={typeRow}>
          <span className={css({ fontSize: "xl", color: "text.default", fontWeight: "600" })}>
            あいう農資材 xl
          </span>
          <span className={typeMeta}>xl · 18px</span>
        </div>
        <div className={typeRow}>
          <span className={css({ fontSize: "2xl", color: "text.default", fontWeight: "600" })}>
            あいう農資材 2xl
          </span>
          <span className={typeMeta}>2xl · 20px</span>
        </div>
        <div className={typeRow}>
          <span className={css({ fontSize: "3xl", color: "text.default", fontWeight: "600" })}>
            あいう農資材 3xl
          </span>
          <span className={typeMeta}>3xl · 21px</span>
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>Radii</h2>
        <p className={sectionLead}>pill / card / button / input。</p>
        <div className={radiusRow}>
          <div
            className={css({
              w: "72px",
              h: "48px",
              bg: "brand.soft",
              borderWidth: "1px",
              borderColor: "brand.primary",
              flexShrink: 0,
              borderRadius: "pill",
            })}
          />
          <div>
            <div className={css({ fontSize: "sm", fontWeight: "700" })}>pill</div>
            <div className={css({ fontSize: "2xs", color: "text.subtle" })}>999px</div>
          </div>
        </div>
        <div className={radiusRow}>
          <div
            className={css({
              w: "72px",
              h: "48px",
              bg: "brand.soft",
              borderWidth: "1px",
              borderColor: "brand.primary",
              flexShrink: 0,
              borderRadius: "card",
            })}
          />
          <div>
            <div className={css({ fontSize: "sm", fontWeight: "700" })}>card</div>
            <div className={css({ fontSize: "2xs", color: "text.subtle" })}>14px</div>
          </div>
        </div>
        <div className={radiusRow}>
          <div
            className={css({
              w: "72px",
              h: "48px",
              bg: "brand.soft",
              borderWidth: "1px",
              borderColor: "brand.primary",
              flexShrink: 0,
              borderRadius: "button",
            })}
          />
          <div>
            <div className={css({ fontSize: "sm", fontWeight: "700" })}>button</div>
            <div className={css({ fontSize: "2xs", color: "text.subtle" })}>12px</div>
          </div>
        </div>
        <div className={radiusRow}>
          <div
            className={css({
              w: "72px",
              h: "48px",
              bg: "brand.soft",
              borderWidth: "1px",
              borderColor: "brand.primary",
              flexShrink: 0,
              borderRadius: "input",
            })}
          />
          <div>
            <div className={css({ fontSize: "sm", fontWeight: "700" })}>input</div>
            <div className={css({ fontSize: "2xs", color: "text.subtle" })}>11px</div>
          </div>
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>Shadows</h2>
        <p className={sectionLead}>shadow / shadow.lift。</p>
        <div
          className={css({
            bg: "surface.card",
            borderWidth: "1px",
            borderColor: "border.default",
            borderRadius: "card",
            p: "4",
            mb: "3",
            boxShadow: "shadow",
          })}
        >
          <div className={css({ fontSize: "sm", fontWeight: "700" })}>shadow</div>
          <div className={css({ fontSize: "2xs", color: "text.subtle", mt: "1" })}>
            0 1px 2px rgba(30,35,31,.05), 0 4px 14px rgba(30,35,31,.06)
          </div>
        </div>
        <div
          className={css({
            bg: "surface.card",
            borderWidth: "1px",
            borderColor: "border.default",
            borderRadius: "card",
            p: "4",
            boxShadow: "shadow.lift",
          })}
        >
          <div className={css({ fontSize: "sm", fontWeight: "700" })}>shadow.lift</div>
          <div className={css({ fontSize: "2xs", color: "text.subtle", mt: "1" })}>
            0 8px 30px rgba(30,35,31,.16)
          </div>
        </div>
      </section>

      <section className={section}>
        <h2 className={sectionTitle}>Samples</h2>
        <p className={sectionLead}>チップ・カード・ボタンの素朴な組み合わせ。</p>
        <div className={samples}>
          <span className={chip}>微生物資材</span>
          <div className={sampleCard}>
            <div className={sampleCardTitle}>サンプル資材カード</div>
            <p className={sampleCardBody}>
              セマンティックトークン（surface.card / text.muted / border.default /
              shadow）で組んだカード。
            </p>
            <div className={starRow}>★★★★☆ 4.2</div>
            <div className={official}>公式マーク（accent.official）</div>
            <div className={warnBanner}>警告色（amber.soft + accent.warn）</div>
          </div>
          <div className={btnPrimary}>プライマリボタン</div>
          <div className={btnGhost}>ゴーストボタン</div>
        </div>
      </section>
    </main>
  );
}
