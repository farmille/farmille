import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import * as auth from "@/lib/auth/browser";

import { Field } from "@/components/form";
import * as actions from "../actions";
import { EvidenceFields } from "./EvidenceFields";

const intentId = "11111111-1111-4111-8111-111111111111";
const evidenceId = "22222222-2222-4222-8222-222222222222";

function renderEvidence() {
  const onCount = vi.fn();
  const onBusy = vi.fn();

  const view = render(
    <Field label="パッケージ資料">
      <EvidenceFields
        intentId={intentId}
        itemKey={null}
        purpose="package"
        onBusy={onBusy}
        onCount={onCount}
      />
    </Field>,
  );

  const input = view.container.querySelector("input[type=file]");

  if (input === null) throw new Error("ファイル選択がありません。");

  return { input, onCount, onBusy };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("申請の添付資料", () => {
  it("予約後のアップロード失敗を残し、削除して選び直せる", async () => {
    vi.spyOn(actions, "reserveEvidence").mockResolvedValue({
      ok: true,
      data: { id: evidenceId, path: "test.png", token: "test-token" },
    });

    const upload = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ message: "offline" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = createClient<Database>("http://supabase.test", "test-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: upload },
    });

    vi.spyOn(auth, "createAuthBrowserClient").mockReturnValue(client);
    vi.spyOn(actions, "finalizeEvidence").mockResolvedValue({ ok: true, data: true });
    vi.spyOn(actions, "removeEvidence").mockResolvedValue({ ok: true, data: true });
    const { input, onCount, onBusy } = renderEvidence();

    fireEvent.change(input, {
      target: { files: [new File(["image"], "資料.png", { type: "image/png" })] },
    });
    expect(await screen.findByText("資料.png（未完了）")).toBeVisible();
    expect(
      screen.getByText(
        "資料をアップロードできませんでした。失敗した資料を削除し、もう一度選択してください。",
      ),
    ).toBeVisible();
    expect(actions.finalizeEvidence).not.toHaveBeenCalled();
    expect(onCount).toHaveBeenLastCalledWith(1);
    expect(onBusy).toHaveBeenLastCalledWith(false);

    fireEvent.click(screen.getByRole("button", { name: "資料.pngを削除" }));
    await waitFor(() => expect(actions.removeEvidence).toHaveBeenCalledWith(evidenceId));
    await waitFor(() => expect(screen.queryByText("資料.png（未完了）")).toBeNull());
    expect(onCount).toHaveBeenLastCalledWith(0);
  });

  it("形式が合わないファイルは予約せずにエラーを出す", async () => {
    vi.spyOn(actions, "reserveEvidence").mockRejectedValue(new Error("予約しない"));
    const { input } = renderEvidence();
    fireEvent.change(input, {
      target: { files: [new File(["text"], "資料.txt", { type: "text/plain" })] },
    });
    expect(
      await screen.findByText("JPG・PNG・PDFを、1ファイル10MB以内で選択してください。"),
    ).toBeVisible();
    expect(actions.reserveEvidence).not.toHaveBeenCalled();
  });
});
