import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useActionState, useState, type ReactNode } from "react";
import * as v from "valibot";

import { StarRating } from "@/components/StarRating";

import { Checkbox } from "./Checkbox";
import { Combobox } from "./Combobox";
import { Field } from "./Field";
import { Fieldset } from "./Fieldset";
import { Form } from "./Form";
import { Input } from "./Input";
import { OtpInput } from "./OtpInput";
import { usePersistedInput } from "./persisted-input";
import { RadioGroup } from "./RadioGroup";
import { Select } from "./Select";
import { Textarea } from "./Textarea";
import type { FieldErrors } from "./types";

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
    <Form action={formAction} persist={false}>
      <RadioGroup
        defaultValue={echo.standpoint ?? undefined}
        label="立場"
        name="standpoint"
        options={STANDPOINTS}
      />
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
    <Form action={formAction} persist={false}>
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
      <Combobox
        emptyMessage="一致する作物がありません"
        label="作目"
        name="cropId"
        options={CROPS}
      />
      <Combobox
        emptyMessage="一致する作物がありません"
        label="比べた作目"
        multiple
        name="compared"
        options={CROPS}
      />
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
      <OtpInput label="認証コード" name="code" />
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

const SIZES = [
  { value: "small", label: "小" },
  { value: "large", label: "大" },
] as const;

function DraftForm({ onSubmit }: { onSubmit?: (formData: FormData) => void }) {
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(new FormData(event.currentTarget));
      }}
      persist="draft"
    >
      <Input label="題名" name="title" />
      <Textarea defaultValue="初期の本文" label="本文" name="body" />
      <Select defaultValue="small" label="大きさ" name="size" options={SIZES} />
      <RadioGroup label="立場" name="standpoint" options={STANDPOINTS} />
      <Field name="terms">
        <Checkbox defaultChecked>利用規約に同意する</Checkbox>
      </Field>
      <Input label="パスワード" name="password" revealable />
      <button type="submit">送信</button>
    </Form>
  );
}

function storedDraft(): string | null {
  return window.sessionStorage.getItem(`farmille:input:${window.location.pathname}#draft`);
}

// 画面を外すときにも控えを書くので、外してから消す
afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

test("ページを離れる前の入力が、開き直したフォームに戻る", async () => {
  const user = userEvent.setup();
  const first = render(<DraftForm />);
  await user.type(screen.getByLabelText("題名"), "トマトの記録");
  await user.clear(screen.getByLabelText("本文"));
  await user.type(screen.getByLabelText("本文"), "書きかけ");
  fireEvent.click(screen.getByRole("radio", { name: "JA関係者" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "利用規約に同意する" }));
  await user.click(screen.getByRole("button", { name: "パスワードを表示する" }));
  await user.type(screen.getByLabelText("パスワード"), "secret-pass");
  fireEvent(window, new Event("pagehide"));
  first.unmount();

  expect(storedDraft()).not.toContain("secret-pass");

  render(<DraftForm />);
  await waitFor(() => expect(screen.getByLabelText("題名")).toHaveValue("トマトの記録"));
  expect(screen.getByLabelText("本文")).toHaveValue("書きかけ");
  expect(screen.getByRole("radio", { name: "JA関係者" })).toHaveAttribute("aria-checked", "true");
  expect(screen.getByRole("checkbox", { name: "利用規約に同意する" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  expect(screen.getByLabelText("パスワード")).toHaveValue("");
});

test("入力を変えずに離れたフォームは控えを残さない", () => {
  const view = render(<DraftForm />);
  fireEvent(window, new Event("pagehide"));
  view.unmount();

  expect(storedDraft()).toBeNull();
});

test("送信して画面が外れたフォームは控えを消し、送信が通らず残ったフォームは控える", async () => {
  const user = userEvent.setup();
  const submitted = render(<DraftForm />);
  await user.type(screen.getByLabelText("題名"), "送信済み");
  fireEvent(window, new Event("pagehide"));
  expect(storedDraft()).toContain("送信済み");
  await user.click(screen.getByRole("button", { name: "送信" }));
  submitted.unmount();
  expect(storedDraft()).toBeNull();

  render(<DraftForm />);
  await user.type(screen.getByLabelText("題名"), "送り直す");
  await user.click(screen.getByRole("button", { name: "送信" }));
  fireEvent(window, new Event("pagehide"));
  expect(storedDraft()).toContain("送り直す");
});

test("Form の外の state で持つ入力欄は、onRestore で戻した値を受け取る", async () => {
  const user = userEvent.setup();
  function OutsideState() {
    const [body, setBody] = useState("");
    return (
      <Form onRestore={(restored) => setBody(restored.get("body")?.[0] ?? "")} persist="outside">
        <Textarea
          label="本文"
          name="body"
          onChange={(event) => setBody(event.target.value)}
          value={body}
        />
      </Form>
    );
  }
  const first = render(<OutsideState />);
  await user.type(screen.getByLabelText("本文"), "外の state");
  first.unmount();

  render(<OutsideState />);
  await waitFor(() => expect(screen.getByLabelText("本文")).toHaveValue("外の state"));
});

function Note({ savedNote = "" }: { savedNote?: string }) {
  const [note, setNote] = useState(savedNote);
  usePersistedInput({
    name: "note",
    schema: v.string(),
    unsaved: note === savedNote ? null : note,
    restore: setNote,
  });
  return <Textarea label="メモ" onChange={(event) => setNote(event.target.value)} value={note} />;
}

function storedNote(): string | null {
  return window.sessionStorage.getItem(`farmille:input:${window.location.pathname}#note`);
}

test("保存していない入力が、開き直した画面に戻る", async () => {
  const user = userEvent.setup();
  const first = render(<Note />);
  await user.type(screen.getByLabelText("メモ"), "書きかけのメモ");
  expect(screen.getByLabelText("メモ")).toHaveValue("書きかけのメモ");
  first.unmount();

  render(<Note />);
  await waitFor(() => expect(screen.getByLabelText("メモ")).toHaveValue("書きかけのメモ"));
});

test("保存済みの値に戻した入力は控えを消す", async () => {
  const user = userEvent.setup();
  render(<Note savedNote="保存済み" />);
  await user.type(screen.getByLabelText("メモ"), "追記");
  expect(storedNote()).toBe(JSON.stringify("保存済み追記"));

  await user.type(screen.getByLabelText("メモ"), "{Backspace}{Backspace}");
  expect(storedNote()).toBeNull();
});

test("形の合わない控えは戻さずに捨てる", async () => {
  window.sessionStorage.setItem(
    `farmille:input:${window.location.pathname}#note`,
    JSON.stringify({ old: "形式" }),
  );
  render(<Note />);

  await waitFor(() => expect(storedNote()).toBeNull());
  expect(screen.getByLabelText("メモ")).toHaveValue("");
});

const scrolled: Element[] = [];

beforeEach(() => {
  scrolled.length = 0;
  Element.prototype.scrollIntoView = vi.fn(function scrollIntoView(this: Element) {
    scrolled.push(this);
  });
});

function SignupLikeForm({ serverErrors }: { serverErrors: FieldErrors }) {
  const [errors, formAction] = useActionState(
    (_previous: FieldErrors | undefined): FieldErrors => serverErrors,
    undefined,
  );
  return (
    <Form action={formAction} errors={errors} persist={false} revealFirstError>
      <Input label="ニックネーム" name="handle" defaultValue="しおさい農園" />
      <Input label="市区町村・番地" name="cityStreet" defaultValue="水戸市" />
      <Input label="建物名" name="buildingName" requirement="optional" />
      <button type="submit">登録する</button>
    </Form>
  );
}

test("サーバーから項目エラーが返ると、画面の上から見て最初のエラーの欄へ移動してフォーカスする", async () => {
  const user = userEvent.setup();
  render(
    <SignupLikeForm
      serverErrors={{
        cityStreet: "市区町村・番地を入力してください。",
        handle: "このニックネームはすでに使われています。",
      }}
    />,
  );

  await user.click(screen.getByRole("button", { name: "登録する" }));

  const handle = screen.getByLabelText("ニックネーム");
  await waitFor(() => expect(handle).toHaveFocus());
  expect(scrolled).toContain(handle);
  expect(screen.getByText("このニックネームはすでに使われています。")).toBeVisible();
});

test("入力チェックで送信が止まると、最初の未入力の欄へ移動してフォーカスする", async () => {
  const user = userEvent.setup();
  const submitted = vi.fn();
  render(
    <Form action={submitted} persist={false} revealFirstError>
      <Input
        label="メールアドレス"
        name="email"
        requirement="required"
        defaultValue="a@example.com"
      />
      <Input label="ニックネーム" name="handle" requirement="required" />
      <Input label="市区町村・番地" name="cityStreet" requirement="required" />
      <button type="submit">登録する</button>
    </Form>,
  );

  await user.click(screen.getByRole("button", { name: "登録する" }));

  const handle = screen.getByLabelText("ニックネーム");
  await waitFor(() => expect(scrolled).toContain(handle));
  expect(handle).toHaveFocus();
  expect(submitted).not.toHaveBeenCalled();
});

test("revealFirstError を付けないフォームは画面を動かさない", async () => {
  const user = userEvent.setup();
  render(
    <Form action={vi.fn()} persist={false}>
      <Input label="ニックネーム" name="handle" requirement="required" />
      <button type="submit">登録する</button>
    </Form>,
  );

  await user.click(screen.getByRole("button", { name: "登録する" }));

  await new Promise((resolve) => requestAnimationFrame(resolve));
  expect(scrolled).toEqual([]);
});
