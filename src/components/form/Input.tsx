"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { useState, type ComponentPropsWithRef } from "react";

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

type InputBodyProps = Omit<ComponentPropsWithRef<"input">, "size" | "required" | "aria-invalid"> & {
  size?: "md" | "sm" | "inline";
  revealable?: boolean;
};

type InputProps = InputBodyProps & Labeling;

export function Input(props: InputProps) {
  const [labeling, inputProps] = splitLabeling(props);
  return (
    <Labeled disabled={inputProps.disabled} labeling={labeling} name={inputProps.name}>
      <InputBody {...inputProps} />
    </Labeled>
  );
}

function InputBody({
  size,
  className,
  revealable = false,
  type,
  disabled,
  readOnly,
  defaultValue,
  ...rest
}: InputBodyProps) {
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
