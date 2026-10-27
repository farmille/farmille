import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { persistKey, writePersisted } from "@/components/form/persisted-input";

import { ReportPageForm } from "./ReportPageForm";
import { filledReport } from "./reportStoryFixture";

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: "test",
} satisfies AppRouterInstance;

const pageMaterial = {
  id: filledReport.materialId,
  name: "スキーポン",
  manufacturerName: "ファーム技研",
};
const chosenMaterial = {
  id: "00000000-0000-4000-8000-000000000102",
  name: "根圏サポートA",
  manufacturerName: "ファーム技研",
};

function renderForm(draft = filledReport, readingAvailable = true) {
  return render(
    <ReportPageForm
      material={pageMaterial}
      userId="00000000-0000-4000-8000-000000000001"
      authorName="しおさい農園"
      crops={[]}
      effects={[]}
      materialEffectNames={[]}
      favoriteCropIds={[]}
      materialCropIds={[]}
      draft={draft}
      documentUrls={[]}
      registeredAddress={{ prefectureCode: 8 }}
      pdfReading={{
        siteKey: "test-site-key",
        remaining: readingAvailable ? 10 : null,
        marks: [],
        checkRequired: false,
      }}
    />,
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AppRouterContext.Provider value={router}>{children}</AppRouterContext.Provider>
      ),
    },
  );
}

describe("保存前の入力の控え", () => {
  afterEach(() => window.sessionStorage.clear());

  it("資材を選び直した入力は、開いた資材の画面の控えから、選んだ資材ごと戻る", async () => {
    const key = persistKey("report", `/materials/${pageMaterial.id}/report/new`);
    writePersisted(key, {
      material: chosenMaterial,
      input: { ...filledReport, materialId: chosenMaterial.id, observedChange: "書きかけの感想" },
    });
    renderForm();
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: "結果・感想" })).toHaveValue("書きかけの感想"),
    );
    expect(
      screen.getByRole("button", { name: `資材：${chosenMaterial.name}` }),
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem(key)).toContain("書きかけの感想");
  });
});

describe("保存と提出の最中", () => {
  afterEach(() => window.sessionStorage.clear());

  function pageOf() {
    const title = document.querySelector("h1");
    if (title === null) throw new Error("タイトルがありません。");
    return title;
  }

  it("下書き保存が終わるまで、フォームを編集できない", async () => {
    renderForm();
    expect(pageOf().closest("[inert]")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "下書き保存" }));
    expect(pageOf().closest("[inert]")).not.toBeNull();
    await waitFor(() => expect(pageOf().closest("[inert]")).toBeNull());
  });

  it("投稿が終わるまで、フォームを編集できない", async () => {
    renderForm({ ...filledReport, methodDetailsAck: true, documentsAck: true, guidelineAck: true });
    for (const name of [
      "資材を使った日（処理日）を記入した",
      "差し込んだグラフ・表に、氏名や連絡先などが写っていないか確認した",
    ])
      fireEvent.click(screen.getByRole("checkbox", { name }));
    fireEvent.click(screen.getByRole("button", { name: "投稿する" }));
    expect(pageOf().closest("[inert]")).not.toBeNull();
    await waitFor(() => expect(pageOf().closest("[inert]")).toBeNull());
  });
});

describe("PDF読み取りの回数取得障害", () => {
  it("読み取りだけを止め、下書きの編集とプレビューを続けられる", async () => {
    renderForm(filledReport, false);
    expect(screen.getByRole("button", { name: "PDF読み取り（いまは使えません）" })).toBeDisabled();
    expect(
      screen.getByText(
        "残り回数を取得できませんでした。手入力で続けられます。再読み込みすると再確認します。",
      ),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "結果・感想" }), {
      target: { value: "手入力で続けた結果" },
    });
    expect(screen.getByRole("textbox", { name: "結果・感想" })).toHaveValue("手入力で続けた結果");
    fireEvent.click(screen.getByRole("button", { name: "プレビュー" }));
    expect(
      await screen.findByRole("heading", { name: "プレビュー（公開後の見え方）" }),
    ).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByText("手入力で続けた結果")).toBeInTheDocument();
  });
});
