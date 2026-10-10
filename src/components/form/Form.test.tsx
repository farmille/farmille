import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useActionState, useState, type ReactNode } from "react";

import { StarRating } from "@/components/StarRating";

import { Checkbox } from "./Checkbox";
import { Combobox } from "./Combobox";
import { Field } from "./Field";
import { Fieldset } from "./Fieldset";
import { Form } from "./Form";
import { OtpInput } from "./OtpInput";
import { RadioGroup } from "./RadioGroup";

type Submitted = { terms: string | null; standpoint: string | null };

const STANDPOINTS = [
  { value: "farmer", label: "生産者" },
  { value: "ja", label: "JA関係者" },
] as const;

function textOf(value: FormDataEntryValue | null): string | null {
  return value === null || value instanceof File ? null : value;
}

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

const CROPS = [
  { value: "tomato", label: "トマト" },
  { value: "strawberry", label: "いちご" },
] as const;

function RejectingForm({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (formData: FormData) => void;
}) {
  const [, formAction] = useActionState((_previous: null, formData: FormData) => {
    onSubmit(formData);
    return null;
  }, null);
  return (
    <Form action={formAction}>
      {children}
      <button type="submit">送信</button>
    </Form>
  );
}

async function submitTwice(submissions: FormData[]): Promise<void> {
  for (const count of [1, 2]) {
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "送信" }));
    });
    await waitFor(() => expect(submissions).toHaveLength(count));
  }
}

test("送信後の reset を越えて、選んだ候補が画面と送信で食い違わない", async () => {
  const user = userEvent.setup();
  const submissions: FormData[] = [];
  render(
    <RejectingForm onSubmit={(formData) => submissions.push(formData)}>
      <Field label="作目" name="cropId">
        <Combobox emptyMessage="一致する作物がありません" options={CROPS} />
      </Field>
      <Field label="比べた作目" name="compared">
        <Combobox emptyMessage="一致する作物がありません" multiple options={CROPS} />
      </Field>
    </RejectingForm>,
  );

  await user.click(screen.getByRole("combobox", { name: "作目" }));
  await user.click(screen.getByRole("option", { name: "いちご" }));
  await user.click(screen.getByRole("combobox", { name: "比べた作目" }));
  await user.click(screen.getByRole("option", { name: "トマト" }));
  await user.keyboard("{Escape}");
  await submitTwice(submissions);

  expect(submissions[1]?.get("cropId")).toBe("strawberry");
  expect(submissions[1]?.getAll("compared")).toEqual(["tomato"]);
  expect(screen.getByRole("combobox", { name: "作目" })).toHaveValue("いちご");
  expect(screen.getByRole("button", { name: "トマトを削除" })).toBeInTheDocument();
});

test("送信後の reset を越えて、認証コードの枠と送る値が食い違わない", async () => {
  const user = userEvent.setup();
  const submissions: FormData[] = [];
  render(
    <RejectingForm onSubmit={(formData) => submissions.push(formData)}>
      <Field label="認証コード" name="code">
        <OtpInput />
      </Field>
    </RejectingForm>,
  );

  await user.type(screen.getByLabelText("認証コード"), "123456");
  await submitTwice(submissions);

  expect(submissions[1]?.get("code")).toBe("123456");
  expect(screen.getByLabelText("認証コード")).toHaveValue("123456");
});

test("値を返さないフォームでは、送信後の reset でチェックが画面と送信の両方で外れる", async () => {
  const submissions: FormData[] = [];
  render(
    <RejectingForm onSubmit={(formData) => submissions.push(formData)}>
      <Field name="terms">
        <Checkbox>利用規約に同意する</Checkbox>
      </Field>
    </RejectingForm>,
  );

  fireEvent.click(screen.getByRole("checkbox", { name: "利用規約に同意する" }));
  await submitTwice(submissions);

  expect(submissions[0]?.get("terms")).toBe("on");
  expect(submissions[1]?.get("terms")).toBeNull();
  expect(screen.getByRole("checkbox", { name: "利用規約に同意する" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("送信後の reset を越えて、選んだ星が画面と送信で食い違わない", async () => {
  const submissions: FormData[] = [];
  function Stars() {
    const [rating, setRating] = useState(0);
    return (
      <Fieldset legend="評価" name="rating">
        <StarRating mode="input" onChange={setRating} value={rating} />
      </Fieldset>
    );
  }
  render(
    <RejectingForm onSubmit={(formData) => submissions.push(formData)}>
      <Stars />
    </RejectingForm>,
  );

  fireEvent.click(screen.getByRole("radio", { name: "4" }));
  await submitTwice(submissions);

  expect(submissions[0]?.get("rating")).toBe("4");
  expect(submissions[1]?.get("rating")).toBe("4");
  expect(screen.getByRole("radio", { name: "4" })).toHaveAttribute("aria-checked", "true");
});
