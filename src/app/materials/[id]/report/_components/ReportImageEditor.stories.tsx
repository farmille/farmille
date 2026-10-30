import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ReportImageEditor } from "./ReportImageEditor";

function sample() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");

  if (ctx === null) return canvas;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 640, 420);
  ctx.fillStyle = "seagreen";
  ctx.fillRect(120, 140, 120, 220);
  ctx.fillRect(360, 90, 120, 270);

  return canvas;
}

const meta = {
  title: "Pages/materials/[id]/report/ReportImageEditor",
  component: ReportImageEditor,
  parameters: { layout: "fullscreen" },
  args: { open: true, original: null, current: null, onDone: fn(), onCancel: fn() },
  render: (args) => {
    const canvas = sample();

    return <ReportImageEditor {...args} original={canvas} current={canvas} />;
  },
} satisfies Meta<typeof ReportImageEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
