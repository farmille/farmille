"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import {
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithRef,
  type FocusEvent,
} from "react";

import { Icon, type IconName } from "@/components/Icon";
import { css, cx } from "../../../styled-system/css";
import { useFieldContext } from "./field-context";
import { Labeled, splitLabeling, type Labeling } from "./Labeled";
import { useRestoredText } from "./persisted-input";
import { controlRecipe } from "./recipes";

const revealShell = css({ position: "relative", display: "block", w: "full" });

const revealButton = css({
  position: "absolute",
  insetBlock: "0",
  insetInlineEnd: "1",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  w: "9",
  p: "0",
  color: "text.subtle",
  bg: "transparent",
  borderWidth: "0",
  cursor: "pointer",
  _disabled: { cursor: "not-allowed" },
  _focusVisible: {
    outlineWidth: "2px",
    outlineStyle: "solid",
    outlineColor: "primary.600",
    borderRadius: "input",
  },
});

const revealState = {
  hidden: { type: "password", label: "パスワードを表示する", icon: "visibility" },
  visible: { type: "text", label: "パスワードを隠す", icon: "visibility_off" },
} as const satisfies Record<string, { type: "password" | "text"; label: string; icon: IconName }>;

const EMAIL_TYPE_MISMATCH_MESSAGE =
  "メールアドレスの形式が正しくありません。半角英数字で、「@」を含めて入力してください。";

const ZERO_WIDTH_CHARACTERS = /[\u200B-\u200D\uFEFF]/g;

/** 日本語入力のまま打った全角の英数字・記号を半角にし、貼り付けで混じる見えない文字と前後の空白を除く。 */
function normalizeEmail(value: string): string {
  return value.replace(ZERO_WIDTH_CHARACTERS, "").normalize("NFKC").trim();
}

/** NFKC で半角にならないハイフンの仲間と、日本語入力で「-」を打つと入る長音（ー）。 */
const PHONE_HYPHENS = /[‐‑‒–—―−ー]/g;

/** 日本語入力のまま打った全角の数字・ハイフン・空白を半角にする。 */
function normalizePhone(value: string): string {
  return value.normalize("NFKC").replace(PHONE_HYPHENS, "-");
}

/** 欄を離れたときに値を整える入力の種類と、その整え方。 */
function blurNormalizer(type: InputBodyProps["type"]): ((value: string) => string) | null {
  if (type === "email") return normalizeEmail;
  if (type === "tel") return normalizePhone;
  return null;
}

/**
 * 欄から離れたときに値を整える。手で入力したときと同じ input イベントで値を差し替え、
 * value で持つ画面の state と Base UI の検証にも同じ値を渡す。
 */
function normalizeOnBlur(
  event: FocusEvent<HTMLInputElement>,
  normalize: (value: string) => string,
) {
  const input = event.currentTarget;
  const normalized = normalize(input.value);
  if (normalized === input.value) return;
  // React が要素に被せた value を通さず、ブラウザ本来の value を書き換える（input イベントで React に変化を伝えるため）
  if (!Reflect.set(HTMLInputElement.prototype, "value", normalized, input)) {
    throw new Error("入力欄の値を書き換えられませんでした。");
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

type InputBodyProps = Omit<ComponentPropsWithRef<"input">, "size" | "required" | "aria-invalid"> & {
  size?: "md" | "sm" | "inline";
  revealable?: boolean;
};

type InputProps = InputBodyProps &
  Labeling & {
    /**
     * 欄を離れたときに値を確かめ（ニックネームが使われていないかなど）、返した文言を欄の下に出す。
     * 入力し直すと消す。送信時の確認の代わりにはしない。
     */
    check?: (value: string) => Promise<string | null>;
  };

export function Input({ check, ...props }: InputProps) {
  const [labeling, inputProps] = splitLabeling(props);
  const checked = useBlurCheck(check);
  if (check !== undefined && labeling.label === null) {
    throw new Error("check は、自分のラベルを持つ Input でだけ使えます。");
  }
  return (
    <Labeled
      disabled={inputProps.disabled}
      labeling={{ ...labeling, error: labeling.error ?? checked.error }}
      name={inputProps.name}
      typeMismatchMessage={inputProps.type === "email" ? EMAIL_TYPE_MISMATCH_MESSAGE : undefined}
    >
      <InputBody
        {...inputProps}
        onBlur={(event) => {
          void checked.onBlur(event);
          inputProps.onBlur?.(event);
        }}
        onChange={(event) => {
          checked.onChange(event);
          inputProps.onChange?.(event);
        }}
      />
    </Labeled>
  );
}

/** 欄を離れたときの確認。確かめている間に入力し直したら、古い値の結果は出さない。 */
function useBlurCheck(check: InputProps["check"]) {
  const [error, setError] = useState<string | undefined>(undefined);
  const current = useRef("");
  return {
    error,
    onBlur: async (event: FocusEvent<HTMLInputElement>) => {
      if (check === undefined) return;
      const value = event.currentTarget.value;
      current.current = value;
      if (value.trim() === "") return;
      const message = await check(value);
      if (current.current === value) setError(message ?? undefined);
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      if (check === undefined) return;
      current.current = event.target.value;
      setError(undefined);
    },
  };
}

function InputBody({
  size,
  className,
  revealable = false,
  type,
  disabled,
  readOnly,
  defaultValue,
  onBlur,
  ...rest
}: InputBodyProps) {
  const normalize = blurNormalizer(type);
  const { required, name } = useFieldContext();
  const restored = useRestoredText(rest.name ?? name);
  const [shown, setShown] = useState(false);
  const state = revealState[shown ? "visible" : "hidden"];
  const input = (
    <BaseInput
      {...rest}
      // パスワードは表示中に type が text になるので、type ではなく印で控えから外す
      data-persist={revealable ? "never" : undefined}
      defaultValue={rest.value === undefined ? (restored ?? defaultValue) : defaultValue}
      className={cx(
        controlRecipe({
          size,
          reveal: revealable || undefined,
          readOnly: readOnly || undefined,
        }),
        className,
      )}
      disabled={disabled}
      onBlur={
        normalize === null
          ? onBlur
          : (event) => {
              normalizeOnBlur(event, normalize);
              onBlur?.(event);
            }
      }
      readOnly={readOnly}
      required={required}
      type={revealable ? state.type : type}
    />
  );

  if (!revealable) return input;

  return (
    <span className={revealShell}>
      {input}
      <button
        aria-label={state.label}
        className={revealButton}
        disabled={disabled}
        onClick={() => setShown((current) => !current)}
        type="button"
      >
        <Icon name={state.icon} size="sm" />
      </button>
    </span>
  );
}
