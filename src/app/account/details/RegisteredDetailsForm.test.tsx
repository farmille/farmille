import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import * as actions from "./actions";
import { RegisteredDetailsForm } from "./RegisteredDetailsForm";
import meta from "./RegisteredDetailsForm.stories";

afterEach(() => vi.restoreAllMocks());

describe("登録情報の編集", () => {
  it("保存エラー後のresetでも入力した氏名・電話・建物名を保持する", async () => {
    vi.spyOn(actions, "saveRegisteredDetailsAction").mockResolvedValue({
      status: "error",
      message: "登録情報を保存できませんでした。",
      values: {
        familyName: "佐藤",
        givenName: "花子",
        phone: "090-1234-5678",
        postalCode: "310-0011",
        prefectureCode: "8",
        cityStreet: "水戸市三の丸1-2-3",
        buildingName: "農業会館202",
      },
    });
    const user = userEvent.setup();
    render(<RegisteredDetailsForm {...meta.args} />);
    await user.clear(screen.getByLabelText("本名（姓）"));
    await user.type(screen.getByLabelText("本名（姓）"), "佐藤");
    await user.clear(screen.getByLabelText(/^電話番号/));
    await user.type(screen.getByLabelText(/^電話番号/), "090-1234-5678");
    await user.type(screen.getByLabelText(/^建物名・部屋番号/), "農業会館202");
    await user.click(screen.getByRole("button", { name: "登録情報を保存する" }));

    await screen.findByText("登録情報を保存できませんでした。");
    expect(screen.getByLabelText("本名（姓）")).toHaveValue("佐藤");
    expect(screen.getByLabelText(/^電話番号/)).toHaveValue("090-1234-5678");
    expect(screen.getByLabelText(/^建物名・部屋番号/)).toHaveValue("農業会館202");
  });
});
