import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer, type FormEvent } from "react";
import { describe, expect, it } from "vitest";

import { Fieldset } from "./form/Fieldset";
import { Form } from "./form/Form";
import { StarRating } from "./StarRating";

function Rating({ initial = 0 }: { initial?: number }) {
  const [value, setValue] = useReducer((_current: number, next: number) => next, initial);
  return <StarRating mode="input" onChange={setValue} value={value} />;
}

describe("StarRating（入力）", () => {
  it("各星は数字だけの名前を持ち、Tab で止まるのは1か所で、矢印キーで選び直せる", async () => {
    const user = userEvent.setup();
    render(<Rating initial={3} />);

    const stars = screen.getAllByRole("radio");
    expect(stars.filter((star) => star.tabIndex === 0)).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "3" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "4" }));
    expect(screen.getByRole("radio", { name: "4" })).toBeChecked();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "5" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "5" })).toHaveFocus();
  });

  it("Fieldset の name で値を送り、必須なら未選択の送信を止める", async () => {
    const user = userEvent.setup();
    const submitted: FormData[] = [];
    function ReviewRating() {
      const [value, setValue] = useReducer((_current: number, next: number) => next, 0);
      return (
        <Form
          persist={false}
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            submitted.push(new FormData(event.currentTarget));
          }}
        >
          <Fieldset legend="総合評価" name="rating" requirement="required">
            <StarRating mode="input" onChange={setValue} value={value} />
          </Fieldset>
          <button type="submit">投稿する</button>
        </Form>
      );
    }
    render(<ReviewRating />);

    expect(screen.getByRole("radiogroup", { name: "総合評価" })).toHaveAttribute(
      "aria-required",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "投稿する" }));
    expect(submitted).toHaveLength(0);

    await user.click(screen.getByRole("radio", { name: "4" }));
    await user.click(screen.getByRole("button", { name: "投稿する" }));
    expect(submitted[0]?.get("rating")).toBe("4");
  });
});
