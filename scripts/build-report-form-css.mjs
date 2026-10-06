import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";

/*
 * 完成見本（farmille-demo/index.html）に埋め込まれた実証詳細レポート入力（JS 文字列 WIZ_SRC）の
 * <style> を src/app/_mock/report-form.css に写す。
 * 使い方: node scripts/build-report-form-css.mjs <farmille-demo/index.html のパス>
 */
const demoPath = process.argv[2];
if (!demoPath) {
  throw new Error("完成見本の index.html のパスを引数で指定してください。");
}
const outPath = path.join(process.cwd(), "src", "app", "_mock", "report-form.css");
const html = readFileSync(demoPath, "utf8");

// `const WIZ_SRC = "` から、エスケープを読み飛ばしながら閉じる " までを JS 文字列リテラルとして読む。
const marker = 'const WIZ_SRC = "';
const start = html.indexOf(marker);
if (start < 0) throw new Error("見本に WIZ_SRC が見つかりません。");
let wiz = "";
for (let i = start + marker.length; ; i++) {
  if (i >= html.length) throw new Error("WIZ_SRC の文字列が閉じていません。");
  const c = html[i];
  if (c === '"') break;
  if (c !== "\\") {
    wiz += c;
    continue;
  }
  const n = html[++i];
  if (n === "n") wiz += "\n";
  else if (n === "t") wiz += "\t";
  else if (n === "r") wiz += "\r";
  else if (n === "x") {
    wiz += String.fromCharCode(parseInt(html.slice(i + 1, i + 3), 16));
    i += 2;
  } else if (n === "u") {
    wiz += String.fromCharCode(parseInt(html.slice(i + 1, i + 5), 16));
    i += 4;
  } else wiz += n;
}

const styleStart = wiz.indexOf("<style>");
const styleEnd = wiz.indexOf("</style>", styleStart);
if (styleStart < 0 || styleEnd < 0) throw new Error("WIZ_SRC の <style> が見つかりません。");
const root = postcss.parse(wiz.slice(styleStart + "<style>".length, styleEnd));

const SCOPE = ".fm-wiz";
// 見本の確認用の帯（見本データの切り替え）はアプリに持ち込まない。
const DEMO = [/^\.proto\b/];
const KEYFRAMES = { pulse: "fm-wiz-pulse", fadeIn: "fm-wiz-fade-in" };
let dropped = 0;
root.walkAtRules((at) => {
  if (/keyframes$/i.test(at.name) && KEYFRAMES[at.params]) at.params = KEYFRAMES[at.params];
});
root.walkDecls((decl) => {
  if (decl.prop === "animation") {
    for (const [from, to] of Object.entries(KEYFRAMES)) {
      decl.value = decl.value.replace(new RegExp(`\\b${from}\\b`), to);
    }
  }
});
root.walkRules((rule) => {
  if (rule.parent && rule.parent.type === "atrule" && /keyframes$/i.test(rule.parent.name)) return;
  const out = [];
  for (const raw of rule.selectors) {
    const s = raw.trim();
    if (DEMO.some((re) => re.test(s))) continue;
    if (s === "body" || s === ":root") {
      out.push(SCOPE);
      continue;
    }
    out.push(`${SCOPE} ${s}`);
  }
  if (out.length === 0) {
    rule.remove();
    dropped++;
    return;
  }
  rule.selectors = out;
  // 見本の本文書体の名前指定は、next/font が読み込んだ書体（fonts.sans）に置き換える。
  rule.walkDecls("font-family", (decl) => {
    if (decl.value.includes("Noto Sans JP")) decl.value = "var(--fonts-sans)";
  });
});
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
 * 完成見本（farmille-demo/index.html）の実証詳細レポート入力（WIZ_SRC）の <style> をそのまま移したもの。
 * - :root と body の指定は .fm-wiz に置き、すべてのセレクタを .fm-wiz 配下に閉じ込めている。
 * - 見本データを切り替える確認用の帯（.proto）は除いている。@keyframes は名前に fm-wiz- を付けている。
 * - 生成: node scripts/build-report-form-css.mjs <見本の index.html> → oxfmt（手で編集せず、見本を更新したら作り直す）。
 * - アプリ側で足したクラスは report-form-extra.css に置く。
 */
`;
writeFileSync(outPath, header + root.toString().replace(/^\n+/, ""));
console.log(`report-form.css を書き出しました（見本の確認用ルール ${dropped} 件を除外）。`);
