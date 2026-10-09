import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useActionState } from "react";

import { Checkbox } from "./Checkbox";
import { Field } from "./Field";
import { Fieldset } from "./Fieldset";
import { Form } from "./Form";
import { RadioGroup } from "./RadioGroup";

type Submitted = { terms: string | null; standpoint: string | null };

const STANDPOINTS = [
  { value: "farmer", label: "生産者" },
  { value: "ja", label: "JA関係者" },
] as const;

function textOf(value: FormDataEntryValue | null): string | null {
  return value === null || value instanceof File ? null : value;
}

// サーバーで弾かれ、送信値をそのまま返して再表示する（SignupForm と同じ流れ）
function EchoForm({ onSubmit }: { onSubmit: (submitted: Submitted) => void }) {
  const [echo, formAction] = useActionState(
    (_previous: Submitted, formData: FormData): Submitted => {
      const submitted = {
        terms: textOf(formData.get("terms")),
        standpoint: textOf(formData.get("standpoint")),
      };
      onSubmit(submitted);
      return submitted;
    },
    { terms: null, standpoint: null },
  );
  return (
    <Form action={formAction}>
      <Fieldset legend="立場" name="standpoint">
        <RadioGroup defaultValue={echo.standpoint ?? undefined} options={STANDPOINTS} />
      </Fieldset>
      <Field name="terms">
        <Checkbox defaultChecked={echo.terms === "on"}>利用規約に同意する</Checkbox>
      </Field>
      <button type="submit">送信</button>
    </Form>
  );
}

test("送信後のフォームのリセットを越えて、チェックとラジオの値が画面と送信で食い違わない", async () => {
  const submissions: Submitted[] = [];
  render(<EchoForm onSubmit={(submitted) => submissions.push(submitted)} />);

  fireEvent.click(screen.getByRole("checkbox", { name: "利用規約に同意する" }));
  fireEvent.click(screen.getByRole("radio", { name: "JA関係者" }));
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
  });
  await waitFor(() => expect(submissions).toHaveLength(1));
  expect(submissions[0]).toEqual({ terms: "on", standpoint: "ja" });

  // React が送信後にフォームを reset しても、再表示した値のまま送り直せる
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "送信" }));
  });
  await waitFor(() => expect(submissions).toHaveLength(2));
  expect(submissions[1]).toEqual({ terms: "on", standpoint: "ja" });
  expect(screen.getByRole("checkbox", { name: "利用規約に同意する" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});
