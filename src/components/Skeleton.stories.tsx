import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  MaterialHeroSkeleton,
  RatingSkeleton,
  ReadingSkeleton,
  Skeleton,
  SkeletonRegion,
} from "./Skeleton";
import { SkeletonList, SearchResultsSkeleton } from "./SkeletonList";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const MaterialSearch: Story = { render: () => <SearchResultsSkeleton /> };
export const HomeMaterials: Story = {
  render: () => <SkeletonList variant="materialScroll" label="掲載資材を読み込んでいます" />,
};
export const Articles: Story = {
  render: () => <SkeletonList variant="articles" label="記事を読み込んでいます" />,
};
export const Reports: Story = {
  render: () => <SkeletonList variant="reportScroll" label="使用レポートを読み込んでいます" />,
};
export const Reviews: Story = {
  render: () => <SkeletonList variant="reviewScroll" label="レビューを読み込んでいます" />,
};
export const MaterialHero: Story = {
  render: () => (
    <SkeletonRegion label="資材情報を読み込んでいます">
      <MaterialHeroSkeleton />
    </SkeletonRegion>
  ),
};
export const Rating: Story = {
  render: () => (
    <SkeletonRegion label="評価を読み込んでいます">
      <RatingSkeleton />
    </SkeletonRegion>
  ),
};
export const Reading: Story = { render: () => <ReadingSkeleton /> };
