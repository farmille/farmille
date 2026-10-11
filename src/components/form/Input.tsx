"use client";

import { Input as BaseInput } from "@base-ui/react/input";
import { useState, type ComponentPropsWithRef } from "react";

import { Icon, type IconName } from "@/components/Icon";
import { css, cx } from "../../../styled-system/css";
import { useFieldRequired } from "./field-context";
import { controlRecipe } from "./recipes";

const revealShell = css({ position: "relative", display: "block", w: "100%" });

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

type InputProps = Omit<ComponentPropsWithRef<"input">, "size" | "required" | "aria-invalid"> & {
  size?: "md" | "sm";
  revealable?: boolean;
};

export function Input({
  size,
  className,
  revealable = false,
  type,
  disabled,
  readOnly,
  ...rest
}: InputProps) {
  const required = useFieldRequired();
  const [shown, setShown] = useState(false);
  const state = revealState[shown ? "visible" : "hidden"];
  const input = (
    <BaseInput
      {...rest}
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
