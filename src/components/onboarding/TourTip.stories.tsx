import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useReducer } from "react";
import { fn } from "storybook/test";

import { css } from "../../../styled-system/css";
import { TourTip, type TourTipProps } from "./TourTip";

const fieldStyle = css({
  mt: "24",
  mx: "4",
  p: "4",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border.default",
  borderRadius: "input",
  bg: "surface.card",
  textStyle: "body",
});

/** 光らせる対象の要素を置き、描画後にその要素を渡す。 */
function WithTarget(props: Omit<TourTipProps, "target">) {
  const [target, setTarget] = useReducer(
    (_current: Element | null, next: Element | null) => next,
    null,
  );
  return (
    <>
      <div ref={setTarget} className={fieldStyle}>
        栽培作目
      </div>
      <TourTip {...props} target={target} />
    </>
  );
}

const meta = {
  title: "Components/Onboarding/TourTip",
  component: TourTip,
  args: { target: null, onSkipStep: fn(), onEnd: fn() },
  render: ({ target: _target, ...props }) => <WithTarget {...props} />,
} satisfies Meta<typeof TourTip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithPrimary: Story = {
  args: {
    title: "栽培作目を選択",
    body: "栽培している作目を候補から選び（複数選択可）、「保存する」を押してください。",
    primary: { label: "入力する", onClick: fn() },
  },
};

export const ActionOnScreen: Story = {
  args: {
    title: "感想口コミを書く",
    section: 3,
    body: "「感想口コミを書く」を押すと、投稿画面が開きます。",
  },
};
