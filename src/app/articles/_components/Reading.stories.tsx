import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ReadingHeading, ReadingMarkdown, ReadingProse, ReadingSubheading } from "./Reading";
import { readingFrame } from "./story-frame";

const meta = {
  title: "Pages/articles/Reading",
  component: ReadingProse,
  decorators: [(Story) => readingFrame(Story())],
  args: { text: "使用区は午後の萎れが軽かった。\n収穫終盤まで葉色が保たれた。" },
} satisfies Meta<typeof ReadingProse>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Prose: Story = {
  render: (args) => (
    <>
      <ReadingHeading>結果・感想</ReadingHeading>
      <ReadingProse {...args} />
    </>
  ),
};
export const Subheading: Story = {
  render: (args) => (
    <>
      <ReadingHeading>比較・使用結果</ReadingHeading>
      <ReadingSubheading>比較した区</ReadingSubheading>
      <ReadingProse {...args} />
      <ReadingSubheading>使用結果の詳細：可販果率</ReadingSubheading>
      <ReadingProse {...args} />
    </>
  ),
};
export const Markdown: Story = {
  render: () => (
    <ReadingMarkdown
      html={
        '<p>微生物資材は、土に定着させてはじめて効果が出ます。</p><h2>1. 水分を保つ</h2><p>散布の前後は土を乾かしすぎないようにします。</p><ul><li>朝夕の涼しい時間に散布する</li><li>散布後に軽く灌水する</li></ul><p>詳しくは<a href="/materials">資材のページ</a>をご覧ください。</p>'
      }
    />
  ),
};
