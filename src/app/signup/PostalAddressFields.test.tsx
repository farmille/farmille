import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Form } from "@/components/form";

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
  it("親フォームをリセットすると、建物名を含む住所を初期値へ戻す", async () => {
    const user = userEvent.setup();
    render(
      <Form persist={false}>
        <PostalAddressFields
          values={{ cityStreet: "千代田区千代田1", buildingName: "農業会館101" }}
        />
        <button type="reset">元に戻す</button>
      </Form>,
    );
    const building = screen.getByLabelText(/^建物名・部屋番号/);
    const cityStreet = screen.getByLabelText(/^市区町村・番地/);
    await user.clear(building);
    await user.type(building, "農業会館202");
    await user.clear(cityStreet);
    await user.type(cityStreet, "千代田区大手町2");
    await user.click(screen.getByRole("button", { name: "元に戻す" }));

    expect(screen.getByLabelText(/^建物名・部屋番号/)).toHaveValue("農業会館101");
    expect(screen.getByLabelText(/^市区町村・番地/)).toHaveValue("千代田区千代田1");
  });

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
