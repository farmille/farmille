import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";

import type { ReadingCatalog } from "./apply";
import type { Skeleton } from "./stages";

export type ReadingMaterial = { name: string; manufacturerName: string; aliases: string[] };

export const REPORT_READING_SYSTEM =
  "あなたは日本の農業試験の成績書を読み、農業資材の実証詳細レポートの下書きに必要な事実を抜き出す。PDFに書かれていることだけを答え、推測や計算で補わない。";

const INTRO = "添付のPDFは農業試験の成績書である。";
const PURPOSE = `${INTRO}投稿者は次の資材（投稿した資材）の実証詳細レポートを書こうとしている。`;

function list(values: readonly string[]): string {
  return values.map((value) => `- ${value}`).join("\n");
}

function materialSection(material: ReadingMaterial): string {
  const names = [material.name, ...material.aliases].filter((name) => name.trim() !== "");

  return `# 投稿した資材
- 名前：${names.join("、")}
- メーカー：${material.manufacturerName}`;
}

function trialSection(trial: string): string {
  return `# 読み取る試験
投稿者の指定：「${trial.trim()}」
- この指定に合う試験の区と、その区と比べた区（無処理・対照・比較した資材）を読む。指定に合わない試験の区は読まない。
- 指定にPDFの中での資材の呼び名とこの資材の関係（例：「高活性腐植資材区がこの資材」）があれば、その呼び名の区を投稿した資材の区（"posted"）として扱う。
- PDFに作物が複数あるときは、指定に合う作物にしぼる。
- 指定に合う試験に投稿した資材の区が見つからなければ、outcome を "no_matching_trial" にし、ほかは空にする。`;
}

const EVIDENCE_RULE =
  "根拠になる原文を短く（100字以内で）そのまま quote に写し、page にそのページ番号（1から数える）";

/** A 骨組み：品種・比較した資材・区・数値の調査項目・グラフの一覧だけを決める。 */
export function skeletonInstructions(material: ReadingMaterial, trial: string): string {
  return [
    `${PURPOSE}この段階では、レポートの骨組み（品種・比較した資材・区・数値の調査項目・グラフの一覧）だけを決める。値・区の説明・根拠はほかの段階で書くので、ここでは書かない。区・調査項目・グラフは、指定に合う試験の分を漏れなく決める。`,
    materialSection(material),
    trialSection(trial),
    `# 区（plots）
- 区は「試した品種」と「使った資材」の組み合わせ1つ。比べた区をすべて入れる。
- treatment：投稿した資材（名前・別名・表記の揺れと、指定で投稿した資材と示された呼び名を含む）を使った区は "posted"、資材を使わない区（無処理・対照・慣行のみ）は "untreated"、別の資材を使った区は "compared"。
- compared の区は comparedMaterials にその資材を入れ、comparedMaterialKey でその key を指す。ほかの区の comparedMaterialKey は空文字。
- 品種が分かるときは varieties に入れ、varietyKey でその key を指す。品種が書かれていなければ varieties は空、varietyKey は空文字。
- 品種の name は品種名だけにする。作物名・系統・括弧の注記は付けない（例：「夏秋ギク『精の一世』早生系」なら「精の一世」）。
- name は原文の区の名前（例：「試験区5 アンビションアルガ処理」）。`,
    `# 数値の調査項目（measurements・graphs）
- measurements には、区ごとの数値がある調査項目（収量・草丈・切り花長・品質など）を1つずつ入れる。日付（収穫日など）や文章の評価のように、数値として比べられない項目は入れない（日付は timingNote に書く）。name は調査項目の名前、unit は単位（無ければ空文字）。
- graphs には、調査項目ごとの比較（調査の時期や部位ごと）を1つずつ入れ、measurementKey でその調査項目の key を指す。heading はその比較の題（例：「定植60日後」）。比較が1つだけなら heading は空文字でよい。`,
    `# key
- key は種類ごとに頭文字を決め、PDFの中で重ならない短い文字列にする：品種 "v1"、比較した資材 "m1"、区 "p1"、調査項目 "k1"、グラフ "g1"。`,
  ].join("\n\n");
}

/** B 単独の欄：作物・都道府県・使用目的などと根拠。候補の一覧はこの呼び出しにだけ入れる。 */
export function singleFieldsInstructions(
  material: ReadingMaterial,
  trial: string,
  catalog: Pick<ReadingCatalog, "crops" | "effectNames">,
): string {
  return [
    `${PURPOSE}この段階では、レポートの単独の欄と、その根拠だけを書く。区や値はほかの段階で書く。`,
    materialSection(material),
    trialSection(trial),
    `# 単独の欄
- crop：次の候補から、試験の作物に当たるものを候補の表記のまま1つ。当たるものが無ければ空文字。
${list(catalog.crops.map(({ name }) => name))}
- purposes：試験で確かめようとした効果を、次の候補の表記のままで選ぶ（当たるものだけ。無ければ空の配列）。
${list(catalog.effectNames)}
- prefecture：試験をした都道府県を、次の表記のまま1つ。分からなければ空文字。
${list(PREFECTURES.map(({ name }) => name))}
- timingStages：投稿した資材を使った生育の段階を、次の番号で選ぶ（当たるものすべて）。
${APPLICATION_TIMINGS.map((name, index) => `- ${index}：${name}`).join("\n")}
- cultivationEnvironment：露地か施設か、土壌・培地、作型など栽培の環境を短く。
- timingNote：資材を使った日付（処理日）、定植日など、日付と生育の状況を短く。
- commonPlotDescription：全区に共通の条件（反復数・1区の株数や面積・施肥やかん水が全区同じであることなど）を短く。
- observedChange：試験の結果と考察を、原文にもとづいて2〜3文で。良くなかった点や差が無かった点も書く。`,
    `# 根拠（evidence）
- 入れた値ごとに、${EVIDENCE_RULE}を入れる。
- ref は欄の名前（"crop"・"prefecture"・"purposes"・"timingStages"・"cultivationEnvironment"・"timingNote"・"commonPlotDescription"・"observedChange"）。
- 書かれていない値は空文字か空の配列にし、根拠も入れない。`,
  ].join("\n\n");
}

function plotList(skeleton: Skeleton): string {
  const variety = new Map(skeleton.varieties.map(({ key, name }) => [key, name]));
  const compared = new Map(skeleton.comparedMaterials.map(({ key, name }) => [key, name]));

  const used = (plot: Skeleton["plots"][number]) =>
    plot.treatment === "posted"
      ? "投稿した資材"
      : plot.treatment === "untreated"
        ? "資材なし（無処理・対照）"
        : `比較した資材「${compared.get(plot.comparedMaterialKey) ?? ""}」`;

  return skeleton.plots
    .map(
      (plot) =>
        `- ${plot.key}：${plot.name}（品種：${variety.get(plot.varietyKey) || "記載なし"}、使った資材：${used(plot)}）`,
    )
    .join("\n");
}

/**
 * C 値：graphs の区ごとの値・グラフの根拠・調査項目の補足。
 * グラフの一覧に調査項目の key を並べると graphKey に調査項目の key を入れる取り違えが起きるので、名前だけを書く。
 */
export function valueInstructions(skeleton: Skeleton, graphs: Skeleton["graphs"]): string {
  const measurement = new Map(skeleton.measurements.map((item) => [item.key, item]));

  const graphList = graphs
    .map((graph) => {
      const owner = measurement.get(graph.measurementKey);
      const unit = owner?.unit ? `（単位：${owner.unit}）` : "";

      return `- ${graph.key}：「${owner?.name ?? ""}」${unit}${graph.heading ? `・${graph.heading}` : ""}`;
    })
    .join("\n");

  const owners = [...new Set(graphs.map(({ measurementKey }) => measurementKey))]
    .map((key) => `- ${key}：${measurement.get(key)?.name ?? ""}`)
    .join("\n");

  return `${INTRO}次の区とグラフについて、区ごとの値をPDFから書き写す。

# 区
${plotList(skeleton)}

# グラフ
${graphList}

# 値（values）
- 上のグラフと区の組み合わせごとに値を1つずつ入れ、graphKey にグラフの key（g で始まる）、plotKey に区の key（p で始まる）を入れる。
- value は原文の文字列のまま書く（例：「1126±139 B」「33.6a」。有意差の記号や±の誤差も含める）。
- PDFに値が無い組み合わせは入れない。推測や計算で補わない。上に無いグラフや区の値は入れない。

# 調査項目の補足（bodies）
次の調査項目ごとに、有意差の検定方法や記号の意味など、グラフだけでは伝わらない補足を短く書く（無ければ空文字）。key には調査項目の key（k で始まる）を入れる。
${owners}

# 根拠（evidence）
- グラフごとに、値の根拠になる表や図の題を含む原文を短く（100字以内で）そのまま quote に写し、page にそのページ番号（1から数える）、ref にグラフの key を入れる。`;
}

/** D 区の説明：資材の使い方と区ごとの条件が同じ区を組にまとめ、組ごとの説明と、品種・比較した資材の根拠を返す。 */
export function plotInstructions(skeleton: Skeleton): string {
  const named = [
    ...skeleton.varieties.map(({ key, name }) => `- ${key}：品種「${name}」`),
    ...skeleton.comparedMaterials.map(({ key, name }) => `- ${key}：比較した資材「${name}」`),
  ];

  return `${INTRO}次の区について説明を書き、区・品種・比較した資材の根拠を写す。

# 区
${plotList(skeleton)}

# 品種と比較した資材
${named.length > 0 ? named.join("\n") : "（なし）"}

# 区の説明（groups）
- 資材の使い方（使った資材・施用方法・希釈倍率・使用量・回数・時期・区の規模）と、施肥など区ごとの条件の違いが同じ区を1つの組にまとめる。使い方や条件が1つでも違う区は、別の組にする。
- plotKeys にその組の区の key（p で始まる）をすべて入れる。上の区は、どれか1つの組に必ず入れる。
- description には、その組の区の資材の使い方・区ごとの条件・区の規模を、原文にもとづいて短く書く。
- quote と page には、その説明の${EVIDENCE_RULE}を入れる。

# 根拠（evidence）
- 品種と比較した資材ごとに、${EVIDENCE_RULE}、ref にその key を入れる。`;
}
