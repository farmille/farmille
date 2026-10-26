import { render, screen, waitFor } from "@testing-library/react";
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

function renderForm() {
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
      draft={filledReport}
      documentUrls={[]}
      registeredAddress={{ prefectureCode: 8 }}
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
