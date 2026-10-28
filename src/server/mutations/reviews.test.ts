import { describe, expect, it, vi } from "vitest";

import { requireGeneralUser } from "@/server/auth";
import {
  createReviewWithDependencies,
  type ReviewMutationInput,
  validateReviewFormData,
} from "@/server/mutations/reviews";
import { createServerSupabase } from "@/server/supabase";

const materialId = "11111111-1111-4111-8111-111111111111";
const cropId = "22222222-2222-4222-8222-222222222222";
const secondCropId = "55555555-5555-4555-8555-555555555555";

function validFormData(): FormData {
  const formData = new FormData();
  formData.append("cropIds", cropId);
  formData.set("rating", "4");
  formData.set("body", "定植後に使用し、葉の状態を継続して観察しました。");
  formData.set("pesticideAck", "on");
  formData.set(
    "newPhotos",
    JSON.stringify([
      {
        path: "33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444.jpg",
        caption: " 使用前 ",
      },
    ]),
  );
  return formData;
}

describe("validateReviewFormData", () => {
  it("必須項目と写真情報を型付き入力へ変換する", () => {
    const result = validateReviewFormData(validFormData());

    expect(result).toEqual({
      ok: true,
      input: {
        cropIds: [cropId],
        cropNameOther: null,
        rating: 4,
        body: "定植後に使用し、葉の状態を継続して観察しました。",
        pesticideAck: true,
        newPhotos: [
          {
            path: "33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444.jpg",
            caption: "使用前",
          },
        ],
      },
    });
  });

  it("作物マスタにない作目は「その他」の名前として受け取る", () => {
    const formData = validFormData();
    formData.delete("cropIds");
    formData.set("cropNameOther", " ステビア ");
    const result = validateReviewFormData(formData);
    expect(result.ok && result.input).toMatchObject({ cropIds: [], cropNameOther: "ステビア" });
  });

  it("作目の選択と「その他」の名前を同時には受け付けない", () => {
    const formData = validFormData();
    formData.set("cropNameOther", "ステビア");
    expect(validateReviewFormData(formData)).toMatchObject({
      ok: false,
      fieldErrors: { cropIds: "使用対象作目を1つ選んでください。" },
    });
  });

  it("作目の選択も「その他」の名前も無ければ受け付けない", () => {
    const formData = validFormData();
    formData.delete("cropIds");
    formData.set("cropNameOther", "   ");
    expect(validateReviewFormData(formData)).toMatchObject({
      ok: false,
      fieldErrors: { cropIds: "使用対象作目を1つ選んでください。" },
    });
  });

  it("星・本文・作目・写真パスを server 側で検証する", () => {
    const formData = validFormData();
    formData.delete("cropIds");
    formData.append("cropIds", "not-a-uuid");
    formData.set("rating", "6");
    formData.set("body", "   ");
    formData.set("newPhotos", JSON.stringify([{ path: "../outside.jpg", caption: null }]));
    const result = validateReviewFormData(formData);

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        cropIds: expect.any(String),
        rating: expect.any(String),
        body: expect.any(String),
        photos: expect.any(String),
      },
    });

    {
      const formData = validFormData();
      formData.delete("pesticideAck");
      const result = validateReviewFormData(formData);

      expect(result).toMatchObject({
        ok: false,
        fieldErrors: { pesticideAck: "内容を確認し、同意してください。" },
      });
    }
  });

  it("本文は2000文字まで受け付け、超えたら欄のエラーを返す", () => {
    const accepted = validFormData();
    accepted.set("body", "あ".repeat(2000));
    expect(validateReviewFormData(accepted)).toMatchObject({ ok: true });

    const rejected = validFormData();
    rejected.set("body", "あ".repeat(2001));
    expect(validateReviewFormData(rejected)).toEqual({
      ok: false,
      fieldErrors: { body: "感想口コミ本文は2000文字以内で入力してください。" },
    });
  });

  it("送信時に CRLF になった改行は1文字と数える", () => {
    const formData = validFormData();
    formData.set("body", `${"あ".repeat(999)}\r\n${"い".repeat(1000)}`);
    expect(validateReviewFormData(formData)).toMatchObject({ ok: true });
  });

  it("複数作目の送信を拒否する", () => {
    const formData = validFormData();
    formData.append("cropIds", secondCropId);

    expect(validateReviewFormData(formData)).toMatchObject({
      ok: false,
      fieldErrors: { cropIds: expect.any(String) },
    });
  });
});

describe("createReview", () => {
  it("メーカーセッションを DB 操作前に拒否する", async () => {
    const authenticate = vi.fn<typeof requireGeneralUser>();
    const createSupabase = vi.fn<typeof createServerSupabase>();
    authenticate.mockResolvedValue({ ok: false, error: "forbidden" });
    const input: ReviewMutationInput = {
      materialId,
      cropIds: [cropId],
      cropNameOther: null,
      rating: 5,
      body: "使用後の状態を記録しました。",
      pesticideAck: true,
      newPhotos: [],
    };

    await expect(
      createReviewWithDependencies(input, authenticate, createSupabase),
    ).resolves.toEqual({ ok: false, error: "forbidden" });
    expect(createSupabase).not.toHaveBeenCalled();
  });
});
