import { describe, expect, it } from "vitest";

import { validateUsageReportSubmission } from "@/server/mutations/usage-reports";
import { createBlankCropReport, type UsageReportFormPayload } from "@/server/usage-reports/model";

function validPayload(): UsageReportFormPayload {
  const crop = createBlankCropReport("crop-id");
  crop.observedChange = "葉の萎れが軽くなったように見えた。";
  crop.purposeTags = ["耐暑性改善"];
  crop.prefectureCode = "12";
  crop.cultivationType = "facility";
  crop.growthStage = "収穫期";
  crop.applicationDates = ["2026-07-10"];
  crop.applicationMethod = "spray";
  crop.sprayDilutionValue = "1000";

  return {
    cropReports: [crop],
    media: [],
    summary: "次回は対照区を設けて確認したい。",
    pesticideAck: true,
  };
}

describe("使用レポート提出時の必須検証", () => {
  it("必須項目が揃った入力を受け付ける", () => {
    expect(validateUsageReportSubmission(validPayload())).toEqual({});
  });

  it("作物ごとの不足をフィールド単位で返す", () => {
    const payload = validPayload();
    payload.cropReports[0].observedChange = "";
    payload.cropReports[0].applicationDates = [];
    payload.pesticideAck = false;

    expect(validateUsageReportSubmission(payload)).toMatchObject({
      "crop-id.observedChange": "観察した変化を入力してください。",
      "crop-id.applicationDates": "処理日を1日以上選択してください。",
      pesticideAck: "内容を確認し、同意にチェックを入れてください。",
    });
  });
});
