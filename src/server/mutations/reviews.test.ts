import { describe, expect, it, vi } from "vitest";

import {
  createReviewWithDependencies,
  type ReviewMutationInput,
  validateReviewFormData,
} from "@/server/mutations/reviews";
import { requireGeneralUser } from "@/server/auth";
import { createServerSupabase } from "@/server/supabase";

const materialId = "11111111-1111-4111-8111-111111111111";
const cropId = "22222222-2222-4222-8222-222222222222";
const secondCropId = "55555555-5555-4555-8555-555555555555";

function validFormData(): FormData {
  const formData = new FormData();
  formData.append("cropIds", cropId);
  formData.set("rating", "4");
  formData.set("body", "定植後に使用し、葉の状態を継続して観察しました。");
  formData.set("purchaseChannel", "ja");
  formData.set("hasControlPlot", "on");
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
        rating: 4,
        body: "定植後に使用し、葉の状態を継続して観察しました。",
        purchaseChannel: "ja",
        hasControlPlot: true,
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

  it("農薬表現同意が無ければ送信を拒否する", () => {
    const formData = validFormData();
    formData.delete("pesticideAck");
    const result = validateReviewFormData(formData);

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { pesticideAck: "内容を確認し、同意してください。" },
    });
  });

  it("星・本文・作目・購入場所・写真パスを server 側で検証する", () => {
    const formData = validFormData();
    formData.delete("cropIds");
    formData.append("cropIds", "not-a-uuid");
    formData.set("rating", "6");
    formData.set("body", "   ");
    formData.set("purchaseChannel", "public-marketplace");
    formData.set("newPhotos", JSON.stringify([{ path: "../outside.jpg", caption: null }]));
    const result = validateReviewFormData(formData);

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        cropIds: expect.any(String),
        rating: expect.any(String),
        body: expect.any(String),
        purchaseChannel: expect.any(String),
        photos: expect.any(String),
      },
    });
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
      rating: 5,
      body: "使用後の状態を記録しました。",
      purchaseChannel: null,
      hasControlPlot: false,
      pesticideAck: true,
      newPhotos: [],
    };

    await expect(
      createReviewWithDependencies(input, authenticate, createSupabase),
    ).resolves.toEqual({ ok: false, error: "forbidden" });
    expect(createSupabase).not.toHaveBeenCalled();
  });
});
