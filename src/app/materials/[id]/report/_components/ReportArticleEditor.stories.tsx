import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { createBlankUsageReport } from "@/lib/usage-report";

import { ReportArticleEditor } from "./ReportArticleEditor";
import { filledReport } from "./reportStoryFixture";

const meta = {
  title: "App/Materials/Report/ReportArticleEditor",
  component: ReportArticleEditor,
  decorators: [(Story) => <div className="fm">{Story()}</div>],
  args: {
    input: filledReport,
    onChange: fn(),
    errors: {},
    preview: false,
    missingLabels: [],
    materialName: "土づくり微生物資材",
    cropName: "トマト",
    documentUrls: [
      { id: "88888888-8888-4888-8888-888888888888", url: "https://example.com/trial.pdf" },
    ],
    uploading: false,
    onUpload: fn(),
  },
  render: function ArticleEditorStory(args) {
    const [input, setInput] = useState(args.input);
    return <ReportArticleEditor {...args} input={input} onChange={setInput} />;
  },
} satisfies Meta<typeof ReportArticleEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Editing: Story = {};
export const Preview: Story = {
  args: { preview: true, missingLabels: ["品種", "調査した範囲"] },
};
export const Blank: Story = {
  args: {
    input: createBlankUsageReport("11111111-1111-4111-8111-111111111111"),
    errors: { guidelineAck: "※ 投稿ガイドラインへの同意が必要です" },
  },
};
