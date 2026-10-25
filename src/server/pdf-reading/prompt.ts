import { APPLICATION_TIMINGS } from "@/lib/material-page-editor";
import { PREFECTURES } from "@/lib/prefectures";

import type { ReadingCatalog } from "./apply";

export type ReadingMaterial = { name: string; manufacturerName: string; aliases: string[] };

export const REPORT_READING_SYSTEM =
  "あなたは日本の農業試験の成績書を読み、農業資材の実証詳細レポートの下書きに必要な事実を抜き出す。PDFに書かれていることだけを答え、推測や計算で補わない。";

function list(values: readonly string[]): string {
  return values.map((value) => `- ${value}`).join("\n");
}

/** レポートの下書きを作るための指示。候補の一覧は毎回同じ順に並べる。 */
export function reportReadingInstructions(
  material: ReadingMaterial,
  scope: string,
  catalog: Pick<ReadingCatalog, "crops" | "effectNames">,
): string {
  const names = [material.name, ...material.aliases].filter((name) => name.trim() !== "");
  return `添付のPDFは農業試験の成績書である。投稿者は次の資材（投稿した資材）の実証詳細レポートを書こうとしている。PDFから下書きに入れる値を抜き出す。

# 投稿した資材
- 名前：${names.join("、")}
- メーカー：${material.manufacturerName}

# 読み取る範囲
${scope.trim() === "" ? "指定なし。PDFの中で投稿した資材を使った区と、その区と比べた区（無処理・対照・比較した資材）をすべて読む。" : `投稿者の指定：「${scope.trim()}」。この指定に合う試験・区だけを読む。`}
- PDFに作物が複数あるときは、範囲の指定に合う作物、指定がなければ投稿した資材が出てくる作物の1つにしぼる。
- 投稿した資材を使った試験が見つからなければ outcome を "no_matching_trial" にし、ほかは空にする。

# 区（plots）
- 区は「試した品種」と「使った資材」の組み合わせ1つ。比べた区をすべて入れる。
- treatment：投稿した資材（名前・別名・表記の揺れを含む）を使った区は "posted"、資材を使わない区（無処理・対照・慣行のみ）は "untreated"、別の資材を使った区は "compared"。
- compared の区は comparedMaterials にその資材を入れ、comparedMaterialKey でその key を指す。ほかの区の comparedMaterialKey は空文字。
- 品種が分かるときは varieties に入れ、varietyKey でその key を指す。品種が書かれていなければ varieties は空、varietyKey は空文字。
- 品種の name は品種名だけにする。作物名・系統・括弧の注記は付けない（例：「夏秋ギク『精の一世』早生系」なら「精の一世」）。
- name は原文の区の名前（例：「試験区5 アンビションアルガ処理」）。description は、その区の資材の使い方（施用方法・希釈倍率・使用量・回数・時期）と区の規模を、原文にもとづいて短く書く。

# 数値の調査項目（measurements・graphs・values）
- measurements には、区ごとの数値がある調査項目（収量・草丈・切り花長・品質など）を1つずつ入れる。日付（収穫日など）や文章の評価のように、数値として比べられない項目は入れない（日付は timingNote に書く）。name は調査項目の名前、unit は単位（無ければ空文字）、body は有意差の検定方法や記号の意味などグラフだけでは伝わらない補足（無ければ空文字）。
- graphs には、調査項目ごとの比較（調査の時期や部位ごと）を1つずつ入れ、measurementKey でその調査項目の key を指す。heading はその比較の題（例：「定植60日後」）。比較が1つだけなら heading は空文字でよい。
- values には区ごとの値を1つずつ入れ、graphKey でグラフの key、plotKey で区の key を指す。value は原文の文字列のまま書く（例：「1126±139 B」「33.6a」。有意差の記号や±の誤差も含める）。PDFに値が無い区は入れない。

# key
- key は種類ごとに頭文字を決め、PDFの中で重ならない短い文字列にする：品種 "v1"、比較した資材 "m1"、区 "p1"、調査項目 "k1"、グラフ "g1"。

# 単独の欄
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
- observedChange：試験の結果と考察を、原文にもとづいて2〜3文で。良くなかった点や差が無かった点も書く。

# 根拠（evidence）
- 入れた値ごとに、根拠になる原文を短く（100字以内で）そのまま quote に写し、page にそのページ番号（1から数える）を入れる。
- ref はどの値の根拠かを示す。単独の欄は欄の名前（"crop"・"prefecture"・"purposes"・"timingStages"・"cultivationEnvironment"・"timingNote"・"commonPlotDescription"・"observedChange"）、品種・比較した資材・区・調査項目・グラフはその key。
- 区ごとの値の根拠は、グラフの根拠（表や図の題を含む原文）でまとめて示し、値ごとには入れない。
- 書かれていない値は空文字か空の配列にし、根拠も入れない。`;
}
