import { Icon } from "@/components/Icon";
import type { ReactNode } from "react";

import { textStyles } from "@/theme/textStyles";
import { semanticTokens, tokens } from "@/theme/tokens";

import { css, cx } from "../../../../styled-system/css";

type TokenLeaf = {
  readonly value: string;
  readonly description?: string;
};

type TokenBranch = {
  readonly [name: string]: TokenBranch | TokenLeaf;
};

type DisplayToken = {
  name: string;
  value: string;
  description?: string;
};

type ColorDisplayToken = DisplayToken & {
  color: string;
  reference?: string;
};

function isTokenLeaf(node: TokenBranch | TokenLeaf): node is TokenLeaf {
  return Object.hasOwn(node, "value");
}

/** Panda と同じ DEFAULT 規則で、入れ子の定義を表示用のドット記法へ展開する。 */
function flattenTokenBranch(branch: TokenBranch, prefix = ""): DisplayToken[] {
  return Object.entries(branch).flatMap(([segment, node]) => {
    const name =
      segment === "DEFAULT" ? prefix : prefix.length === 0 ? segment : `${prefix}.${segment}`;

    if (isTokenLeaf(node)) {
      return [{ name, value: node.value, description: node.description }];
    }

    return flattenTokenBranch(node, name);
  });
}

const primitiveColorTokens = flattenTokenBranch(tokens.colors);

function resolveSemanticColor(token: DisplayToken): ColorDisplayToken {
  const match = /^\{colors\.([A-Za-z0-9.]+)\}$/u.exec(token.value);
  const reference = match?.[1];

  if (reference === undefined) {
    throw new Error(`セマンティックカラー「${token.name}」の参照形式が不正です。`);
  }

  const primitive = primitiveColorTokens.find((candidate) => candidate.name === reference);

  if (primitive === undefined) {
    throw new Error(
      `セマンティックカラー「${token.name}」の参照先「${reference}」が存在しません。`,
    );
  }

  return { ...token, color: primitive.value, reference };
}

const primitiveColors = primitiveColorTokens.map((token) => ({
  ...token,
  color: token.value,
}));
const semanticColors = flattenTokenBranch(semanticTokens.colors).map(resolveSemanticColor);
const fontSizes = flattenTokenBranch(tokens.fontSizes);
const fontWeights = flattenTokenBranch(tokens.fontWeights);
const lineHeights = flattenTokenBranch(tokens.lineHeights);
const spacing = flattenTokenBranch(tokens.spacing).toSorted(
  (left, right) => Number.parseFloat(left.value) - Number.parseFloat(right.value),
);
const radii = flattenTokenBranch(tokens.radii);
const shadows = flattenTokenBranch(tokens.shadows);
const sizes = flattenTokenBranch(tokens.sizes);
const aspectRatios = flattenTokenBranch(tokens.aspectRatios);
const textStyleTokens: DisplayToken[] = Object.entries(textStyles).map(([name, role]) => ({
  name,
  value: JSON.stringify(role.value),
  description: role.description,
}));

const frame = css({
  minH: "100%",
  bg: "surface.page",
  color: "text.default",
  fontFamily: "sans",
  maxW: "content.wide",
  mx: "auto",
  px: { base: "4", tab: "8" },
  py: { base: "6", tab: "10" },
});

const titleStyle = css({
  m: "0",
  fontSize: "3xl",
  letterSpacing: "body",
});

const subtitleStyle = css({
  mt: "2",
  mb: "0",
  color: "text.muted",
  textStyle: "supporting",
});

const sectionStyle = css({ mt: "8" });

const sectionTitleStyle = css({
  m: "0",
  color: "text.default",
  textStyle: "title",
});

const sectionLeadStyle = css({
  mt: "1.5",
  mb: "4",
  color: "text.muted",
  textStyle: "supporting",
});

const swatchGrid = css({
  display: "grid",
  gridTemplateColumns: { base: "repeat(2, minmax(0, 1fr))", tab: "repeat(4, minmax(0, 1fr))" },
  gap: { base: "2.5", tab: "4" },
});

const swatchCard = css({
  overflow: "hidden",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
  boxShadow: "shadow",
});

const swatchPaint = css({
  aspectRatio: "image.landscape",
  borderBottomWidth: "1px",
  borderBottomColor: "border.default",
});

const swatchMeta = css({
  display: "grid",
  gap: "0.5",
  px: "2.5",
  py: "2",
  color: "text.subtle",
  fontSize: "2xs",
  lineHeight: "normal",
});

const tokenNameStyle = css({
  overflowWrap: "anywhere",
  color: "text.default",
  fontFamily: "sans",
  fontSize: "xs",
  fontWeight: "bold",
});

const tokenTable = css({
  borderTopWidth: "1px",
  borderTopColor: "border.default",
});

const tokenRow = css({
  display: "grid",
  gridTemplateColumns: {
    base: "minmax(5.5rem, 0.4fr) minmax(0, 1fr)",
    tab: "12rem minmax(0, 1fr)",
  },
  alignItems: "center",
  gap: "3",
  minH: "12",
  py: "2.5",
  borderBottomWidth: "1px",
  borderBottomColor: "border.default",
});

const tokenValueStyle = css({
  mt: "1",
  overflowWrap: "anywhere",
  color: "text.subtle",
  fontSize: "2xs",
  fontVariantNumeric: "tabular-nums",
  lineHeight: "normal",
});

const tokenDescriptionStyle = css({ mt: "1", textStyle: "supporting", color: "text.muted" });

const textStyleSample = css({ color: "text.default" });

const bodySample = css({ textStyle: "body" });

const typeSample = css({
  color: "text.default",
  fontWeight: "semibold",
});

const spacingTrack = css({
  h: "4",
  overflow: "hidden",
  borderRadius: "pill",
  bg: "primary.200",
});

const spacingBar = css({
  h: "full",
  bg: "primary.600",
});

const radiusSample = css({
  w: "16",
  h: "12",
  borderWidth: "1px",
  borderColor: "primary.600",
  bg: "primary.200",
});

const elevationSample = css({
  w: "20",
  h: "12",
  borderWidth: "1px",
  borderColor: "border.default",
  borderRadius: "card",
  bg: "surface.card",
});

const sizeTrack = css({
  h: "8",
  overflow: "hidden",
  borderRadius: "input",
  bg: "primary.200",
});

const sizeBar = css({
  h: "full",
  bg: "primary.600",
});

const ratioSample = css({
  w: "24",
  maxW: "full",
  borderWidth: "1px",
  borderColor: "primary.600",
  borderRadius: "input",
  bg: "primary.200",
});

const catalog = css({
  display: "grid",
  gap: "6",
  bg: "surface.page",
});

type TokenDocFrameProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

function TokenDocFrame({ title, subtitle, children }: TokenDocFrameProps) {
  return (
    <main className={frame}>
      <h1 className={titleStyle}>{title}</h1>
      <p className={subtitleStyle}>{subtitle}</p>
      {children}
    </main>
  );
}

type TokenSectionProps = {
  title: string;
  lead: string;
  children: ReactNode;
};

function TokenSection({ title, lead, children }: TokenSectionProps) {
  return (
    <section className={sectionStyle}>
      <h2 className={sectionTitleStyle}>{title}</h2>
      <p className={sectionLeadStyle}>{lead}</p>
      {children}
    </section>
  );
}

type TokenRowProps = {
  token: DisplayToken;
  children: ReactNode;
};

function TokenRow({ token, children }: TokenRowProps) {
  return (
    <div className={tokenRow}>
      <code className={tokenNameStyle}>{token.name}</code>
      <div>
        {children}
        <div className={tokenValueStyle}>{token.value}</div>
        {token.description === undefined ? null : (
          <p className={tokenDescriptionStyle}>{token.description}</p>
        )}
      </div>
    </div>
  );
}

type ColorGridProps = {
  items: ColorDisplayToken[];
};

function ColorGrid({ items }: ColorGridProps) {
  return (
    <div className={swatchGrid}>
      {items.map((item) => (
        <article key={item.name} className={swatchCard}>
          <div
            aria-label={`${item.name} の色見本`}
            className={swatchPaint}
            role="img"
            style={{ backgroundColor: item.color }}
          />
          <div className={swatchMeta}>
            <code className={tokenNameStyle}>{item.name}</code>
            <span>
              {item.reference === undefined ? (
                item.value
              ) : (
                <>
                  <Icon name="arrow_forward" size="sm" /> {item.reference}
                </>
              )}
            </span>
            {item.reference === undefined ? null : <span>{item.color}</span>}
          </div>
        </article>
      ))}
    </div>
  );
}

export function ColorTokens() {
  return (
    <TokenDocFrame
      title="Colors"
      subtitle="プリミティブカラー。用途を持つ UI ではセマンティックカラーを優先する。"
    >
      <TokenSection title="Palette" lead="Panda の設定が参照する実値を一覧する。">
        <ColorGrid items={primitiveColors} />
      </TokenSection>
    </TokenDocFrame>
  );
}

export function SemanticColorTokens() {
  return (
    <TokenDocFrame
      title="Semantic Colors"
      subtitle="primary・text・surface・border・accent の用途別カラー。"
    >
      <TokenSection title="Aliases" lead="参照先と解決後の色を同時に確認できる。">
        <ColorGrid items={semanticColors} />
      </TokenSection>
    </TokenDocFrame>
  );
}

export function TypographyTokens() {
  return (
    <TokenDocFrame
      title="Typography"
      subtitle="文字は textStyle の役割から選ぶ。サイズ・ウェイト・行高は役割に無い組み合わせに使う。"
    >
      <TokenSection
        title="Text style"
        lead="役割ごとの組み合わせ。色は含まないので、呼び出し側で足す。"
      >
        <div className={tokenTable}>
          {textStyleTokens.map((token) => (
            <TokenRow key={token.name} token={token}>
              <span className={cx(textStyleSample, css({ textStyle: token.name }))}>
                使用した資材の特徴を記録する。
                <br />
                次の栽培で比較できる形に残す。
              </span>
            </TokenRow>
          ))}
        </div>
      </TokenSection>

      <TokenSection title="Font size" lead="日本語本文で実際の大きさと字面を確認する。">
        <div className={tokenTable}>
          {fontSizes.map((token) => (
            <TokenRow key={token.name} token={token}>
              <span className={typeSample} style={{ fontSize: token.value }}>
                畑の状態を記録する
              </span>
            </TokenRow>
          ))}
        </div>
      </TokenSection>

      <TokenSection title="Font weight" lead="同じサイズで太さの差を比較する。">
        <div className={tokenTable}>
          {fontWeights.map((token) => (
            <TokenRow key={token.name} token={token}>
              <span className={bodySample} style={{ fontWeight: Number(token.value) }}>
                Farmille 農業資材感想口コミ
              </span>
            </TokenRow>
          ))}
        </div>
      </TokenSection>

      <TokenSection title="Line height" lead="2行の本文で行間を比較する。">
        <div className={tokenTable}>
          {lineHeights.map((token) => (
            <TokenRow key={token.name} token={token}>
              <span className={bodySample} style={{ lineHeight: token.value }}>
                使用した資材の特徴を記録する。
                <br />
                次の栽培で比較できる形に残す。
              </span>
            </TokenRow>
          ))}
        </div>
      </TokenSection>
    </TokenDocFrame>
  );
}

export function SpacingTokens() {
  return (
    <TokenDocFrame title="Spacing" subtitle="8px 刻みを基調にした Panda の余白スケール。">
      <TokenSection title="Scale" lead="長い値は表示領域の幅で止め、実値を併記する。">
        <div className={tokenTable}>
          {spacing.map((token) => (
            <TokenRow key={token.name} token={token}>
              <div className={spacingTrack}>
                <div className={spacingBar} style={{ maxWidth: "100%", width: token.value }} />
              </div>
            </TokenRow>
          ))}
        </div>
      </TokenSection>
    </TokenDocFrame>
  );
}

export function RadiusTokens() {
  return (
    <TokenDocFrame title="Radius" subtitle="用途別に固定した角丸。">
      <TokenSection title="Scale" lead="同じ矩形に適用して輪郭を比較する。">
        <div className={tokenTable}>
          {radii.map((token) => (
            <TokenRow key={token.name} token={token}>
              <div className={radiusSample} style={{ borderRadius: token.value }} />
            </TokenRow>
          ))}
        </div>
      </TokenSection>
    </TokenDocFrame>
  );
}

export function ElevationTokens() {
  return (
    <TokenDocFrame title="Elevation" subtitle="カードと浮遊要素に使う影。">
      <TokenSection title="Shadow" lead="surface.card と組み合わせた見え方を確認する。">
        <div className={tokenTable}>
          {shadows.map((token) => (
            <TokenRow key={token.name} token={token}>
              <div className={elevationSample} style={{ boxShadow: token.value }} />
            </TokenRow>
          ))}
        </div>
      </TokenSection>
    </TokenDocFrame>
  );
}

export function SizeTokens() {
  return (
    <TokenDocFrame title="Sizes" subtitle="カード・ダイアログ・読み物などの用途別上限幅。">
      <TokenSection title="Max width" lead="表示領域より長い値は右端で止め、実値を併記する。">
        <div className={tokenTable}>
          {sizes.map((token) => (
            <TokenRow key={token.name} token={token}>
              <div className={sizeTrack}>
                <div className={sizeBar} style={{ maxWidth: "100%", width: token.value }} />
              </div>
            </TokenRow>
          ))}
        </div>
      </TokenSection>
    </TokenDocFrame>
  );
}

export function AspectRatioTokens() {
  return (
    <TokenDocFrame title="Aspect Ratios" subtitle="画像枠の用途別アスペクト比。">
      <TokenSection title="Image" lead="同じ幅に適用して縦横比を比較する。">
        <div className={tokenTable}>
          {aspectRatios.map((token) => (
            <TokenRow key={token.name} token={token}>
              <div className={ratioSample} style={{ aspectRatio: token.value }} />
            </TokenRow>
          ))}
        </div>
      </TokenSection>
    </TokenDocFrame>
  );
}

export function TokenCatalog() {
  return (
    <div className={catalog}>
      <ColorTokens />
      <SemanticColorTokens />
      <TypographyTokens />
      <SpacingTokens />
      <RadiusTokens />
      <ElevationTokens />
      <SizeTokens />
      <AspectRatioTokens />
    </div>
  );
}
