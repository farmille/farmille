import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as actions from "./actions";
import { ProfileEditForm } from "./ProfileEditForm";
import meta from "./ProfileEditForm.stories";

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
});

describe("プロフィール編集", () => {
  it("保存に失敗しても名前・自己紹介・リンクを保持し、次の保存へ渡す", async () => {
    vi.spyOn(actions, "profileHandleCheckAction").mockResolvedValue(null);
    const save = vi.spyOn(actions, "updateProfileAction").mockResolvedValue({
      status: "error",
      message: "保存できませんでした。",
      values: {
        handle: "畑の山田",
        bio: "トマトを育てています。",
        links: "https://example.test/farm",
      },
    });
    const user = userEvent.setup();
    render(<ProfileEditForm {...meta.args} />);
    const handle = screen.getByLabelText(/^ニックネーム/);
    const bio = screen.getByLabelText(/^自己紹介/);
    const links = screen.getByLabelText(/^リンク/);
    await user.clear(handle);
    await user.type(handle, "畑の山田");
    await user.type(bio, "トマトを育てています。");
    await user.type(links, "https://example.test/farm");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await screen.findByText("保存できませんでした。");
    expect(handle).toHaveValue("畑の山田");
    expect(bio).toHaveValue("トマトを育てています。");
    expect(links).toHaveValue("https://example.test/farm");
    await user.click(screen.getByRole("button", { name: "保存する" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    const sent = save.mock.lastCall?.[1];
    expect(sent?.get("handle")).toBe("畑の山田");
    expect(sent?.get("bio")).toBe("トマトを育てています。");
    expect(sent?.get("links")).toBe("https://example.test/farm");
  });
});
