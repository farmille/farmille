import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";

/*
 * 完成見本（farmille-demo/index.html）の <style> を src/app/_mock/mock.css に写す。
 * 使い方: node scripts/build-mock-css.mjs <farmille-demo/index.html のパス>
 */
const demoPath = process.argv[2];
if (!demoPath) {
  throw new Error("完成見本の index.html のパスを引数で指定してください。");
}
const outPath = path.join(process.cwd(), "src", "app", "_mock", "mock.css");

const src = readFileSync(demoPath, "utf8").split("\n");
// 最初の <style> ブロックだけを使う。ホームの背景画像（data URI を含む行）は資材ページに要らないので除く。
const styleStart = src.findIndex((line) => line.trim() === "<style>");
const styleEnd = src.findIndex((line, index) => index > styleStart && line.trim() === "</style>");
if (styleStart < 0 || styleEnd < 0) {
  throw new Error("見本の <style> ブロックが見つかりません。");
}
const lines = src.slice(styleStart + 1, styleEnd).filter((line) => !line.includes("data:image/"));
const root = postcss.parse(lines.join("\n"));

const DEMO = [
  /^(html|body)\b/,
  /^\.phone\b/,
  /^\.notch\b/,
  /^\.topbar\b/,
  /^\.screen-chips\b/,
  /^\.schip\b/,
  /^\.theme-toggle\b/,
  /^#navToggle\b/,
  /^\.nav-head\b/,
  /^\.bottom-nav\b/,
  /^\.bn-/,
  /^\.nav-extra\b/,
  /^\.auth-btns\b/,
  /^\.pc-search\b/,
  /^\.campaign\b/,
  /^\.screen-wrap\b/,
  /^\.screen(?![-\w])/,
  /^#screen\b/,
  /^\.has-fab\b/,
];
let dropped = 0;
root.walkRules((rule) => {
  if (rule.parent && rule.parent.type === "atrule" && /keyframes$/i.test(rule.parent.name)) return;
  const out = [];
  for (const raw of rule.selectors) {
    const s = raw.trim();
    if (s.startsWith(":root[")) continue;
    if (DEMO.some((re) => re.test(s))) continue;
    if (/^:root\b/.test(s)) {
      out.push(s.replace(/^:root/, ".fm"));
      continue;
    }
    out.push(`.fm ${s}`);
  }
  if (out.length === 0) {
    rule.remove();
    dropped++;
    return;
  }
  rule.selectors = out;
});
// 空になった @media 等を消す
let changed = true;
while (changed) {
  changed = false;
  root.walkAtRules((at) => {
    if (at.nodes && at.nodes.filter((n) => n.type !== "comment").length === 0) {
      at.remove();
      changed = true;
    }
  });
}
const header = `/*
 * 完成見本（farmille-demo/index.html）の <style> をそのまま移したもの。
 * - 変数は :root ではなく .fm に置き、すべてのセレクタを .fm 配下に閉じ込めている。
 * - 見本の外枠（body のレイアウト・スマホ枠・画面一覧・下部ナビ等）とホーム背景の data URI は除いている。
 * - 生成: node scripts/build-mock-css.mjs <見本の index.html>→ pnpm format（手で編集せず、見本を更新したら作り直す）。
 * - アプリ側で足したクラスは mock-extra.css に置く。
 * Panda の @layer より後勝ち（レイヤー外）なので、.fm の中では見本のスタイルが優先される。
 */
.fm { color:var(--ink); font-family:var(--sans); -webkit-font-smoothing:antialiased; }
`;
const footer = `

/* 見本の --sans は "Noto Sans JP" の名前指定。アプリでは next/font が読み込んだ書体を fonts.sans から使う。 */
.fm { --sans: var(--fonts-sans); }
`;
writeFileSync(outPath, header + root.toString().replace(/^\n+/, "") + footer);
console.log(`mock.css を書き出しました（見本の外枠のルール ${dropped} 件を除外）。`);
