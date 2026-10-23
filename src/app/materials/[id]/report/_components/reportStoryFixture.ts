import { createBlankUsageReport, type UsageReportInput } from "@/lib/usage-report";

export const storyPhoto = (fill: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${fill}"/><circle cx="200" cy="170" r="70" fill="#6a9a5b"/></svg>`,
  )}`;

const blank = createBlankUsageReport("11111111-1111-4111-8111-111111111111");
const [control, treated] = blank.plots;
if (!control || !treated) throw new Error("区の初期データがありません。");
const extra = { ...control, id: "33333333-3333-4333-8333-333333333333" };

const plots: UsageReportInput["plots"] = [
  {
    ...control,
    name: "無処理区",
    scope: "",
    description: "資材は使っていない。かん水と施肥は処理区と同じ。",
  },
  {
    ...treated,
    name: "処理区",
    scope: "",
    description: "資材を1,000倍に希釈し、10aあたり200Lを葉面散布。7日おきに3回。",
  },
  {
    ...extra,
    name: "倍量区（2,000倍）",
    scope: "",
    description: "資料を参照",
  },
];

export const filledReport: UsageReportInput = {
  ...blank,
  cropId: "22222222-2222-4222-8222-222222222222",
  variety: "桃太郎",
  observedChange:
    "定植から30日ほどで、処理区のほうが葉色が濃く、草勢が揃って見えた。\n収穫期に入ってからも裂果が少なく、可販果の割合が上がった実感がある。",
  purposeTags: ["収量向上", "品質向上"],
  purposeNote: "昨年の裂果が多かったため。",
  prefectureCode: 23,
  city: "豊橋市",
  showCity: true,
  cultivationEnvironment: "ハウス栽培（土耕）。前作はキュウリ。",
  timingStages: [1, 2],
  timingNote: "定植日：4月10日。処理開始：4月17日。",
  plots,
  measurements: [
    {
      id: "44444444-4444-4444-8444-444444444444",
      kind: "image",
      name: "可販果収量",
      unit: "",
      body: "表1の「区A」が無処理区、「区B」が処理区。",
      graphs: [],
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      kind: "text",
      name: "裂果率",
      unit: "",
      body: "収穫期間の裂果率は、処理区が6%で、無処理区（11%）より5ポイント低かった。",
      graphs: [],
    },
  ],
  media: [
    {
      id: "77777777-7777-4777-8777-777777777777",
      url: storyPhoto("#e8f0dc"),
      mediaType: "photo",
      section: "measurements",
      caption: "図1 可販果収量",
      measurementId: "44444444-4444-4444-8444-444444444444",
    },
  ],
  documents: [],
};
