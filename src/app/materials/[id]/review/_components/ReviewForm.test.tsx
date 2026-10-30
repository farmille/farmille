import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PesticideRegistration } from "@/lib/material-page-editor";
import type { ReviewPhoto } from "@/server/queries/reviews";

import { ReviewForm } from "./ReviewForm";

function renderForm(
  body = "",
  pesticideRegistration: PesticideRegistration = "unknown",
  photos: ReviewPhoto[] = [],
) {
  render(
    <ReviewForm
      mode="create"
      material={{
        id: "material-1",
        name: "土づくり微生物資材",
        manufacturerName: "グリーンバイオ",
      }}
      userId="user-1"
      crops={[]}
      targetCropIds={[]}
      pesticideRegistration={pesticideRegistration}
      bodyMaxLength={10}
      initialValues={{ cropIds: [], rating: 0, body, pesticideAck: false, photos }}
    />,
  );
  return screen.getByRole("textbox", { name: "感想口コミ本文" });
}

// 写真の送り先に使う Supabase の接続先。描画するだけなので通信はしない
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example.test");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
});
afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("感想口コミ本文", () => {
  it("送信後のDOM resetでも既存写真の編集中タイトルを保持する", () => {
    renderForm("", "unknown", [
      { id: "photo-1", url: "https://example.com/photo.jpg", caption: "変更前", sort_order: 0 },
    ]);
    const caption = screen.getByRole("textbox", { name: /タイトル.*1枚目の写真/ });
    fireEvent.change(caption, { target: { value: "変更したタイトル" } });
    const form = caption.closest("form");
    if (form === null) throw new Error("口コミフォームがありません。");
    act(() => form.reset());
    expect(caption).toHaveValue("変更したタイトル");
  });

  it("いまの文字数と上限を出す", () => {
    const body = renderForm();

    expect(screen.getByText("0／10文字")).toBeInTheDocument();
    fireEvent.change(body, { target: { value: "根張りがよい" } });

    expect(screen.getByText("6／10文字")).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("上限に達したら、超えた分は入らないことを知らせる", () => {
    const body = renderForm();

    fireEvent.change(body, { target: { value: "あ".repeat(10) } });

    expect(screen.getByText("10／10文字")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "上限の10文字に達しました。10文字を超えた分は入りません。",
    );
  });

  it("もっとくわしく書くときは、実証詳細レポートの入力画面へのリンクを出す", () => {
    renderForm();

    expect(screen.getByRole("link", { name: "実証詳細レポートを書く" })).toHaveAttribute(
      "href",
      "/materials/material-1/report/new",
    );
  });
});

describe("農薬の確認事項", () => {
  it("農薬として登録されていない資材では、この資材に当てはまる文で出す", () => {
    renderForm("", "unregistered");

    expect(
      screen.getByText(
        "この資材は農薬として登録されていないため、病害虫や雑草に効いたと言い切る書き方はしていません。",
      ),
    ).toBeInTheDocument();
  });

  it("農薬登録の有無が分からない資材では、登録されていない資材についての文で出す", () => {
    renderForm("", "unknown");

    expect(
      screen.getByText(
        "農薬として登録されていない資材について、病害虫や雑草への効果を断定する表現は使っていません。",
      ),
    ).toBeInTheDocument();
  });

  it("農薬として登録された資材では出さない", () => {
    renderForm("", "registered");

    expect(screen.queryByText(/農薬として登録されていない/)).toBeNull();
    expect(
      screen.getByText("記入内容は、実際に使用して観察した事実と感じた変化にもとづいています。"),
    ).toBeInTheDocument();
  });
});
