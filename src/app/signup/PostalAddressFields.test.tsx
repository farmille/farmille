import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PostalAddressFields } from "./PostalAddressFields";

async function lookup(postalCode: string) {
  const user = userEvent.setup();
  const postal = screen.getByLabelText("郵便番号");
  await user.clear(postal);
  await user.type(postal, postalCode);
  await user.click(screen.getByRole("button", { name: "住所を自動入力" }));
  return user;
}

describe("PostalAddressFields", () => {
  it("直前の自動入力のままなら次の検索で上書きし、手入力のあとは上書きしない", async () => {
    render(<PostalAddressFields values={{}} />);
    const user = await lookup("1000001");
    const line = screen.getByLabelText("市区町村・番地");
    await waitFor(() => {
      expect(line).toHaveValue("千代田区千代田");
      expect(screen.getByRole("combobox", { name: /^都道府県/ })).toHaveTextContent("東京都");
    });

    await user.clear(line);
    await user.clear(screen.getByLabelText("郵便番号"));
    await user.type(screen.getByLabelText("郵便番号"), "0600000");
    await user.tab();
    await waitFor(() => {
      expect(line).toHaveValue("札幌市中央区");
    });
    expect(screen.getByRole("combobox", { name: /^都道府県/ })).toHaveTextContent("北海道");

    await user.type(line, "1-1");
    await user.clear(screen.getByLabelText("郵便番号"));
    await user.type(screen.getByLabelText("郵便番号"), "1000001");
    await user.click(screen.getByRole("button", { name: "住所を自動入力" }));
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /^都道府県/ })).toHaveTextContent("東京都");
    });
    expect(line).toHaveValue("札幌市中央区1-1");
  });
});
