import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PasskeyLogin } from "./PasskeyLogin";

afterEach(cleanup);

describe("PasskeyLogin", () => {
  it("パスキーの説明をボタンの下に出し、ボタンの説明として読ませる", () => {
    const description =
      "パスキーを登録した方は、パスワードの代わりに、スマートフォンやパソコンの指紋や顔でログインできます。登録は、ログインした後にマイページでできます。";
    render(<PasskeyLogin description={description} next={null} />);

    expect(screen.getByText(description)).toBeVisible();
    expect(screen.getByRole("button", { name: "パスキーでログイン" })).toHaveAccessibleDescription(
      description,
    );
  });
});
