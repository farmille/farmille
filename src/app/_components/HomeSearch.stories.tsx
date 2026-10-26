import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { relatedMaterials } from "@/app/materials/[id]/_components/story-fixtures";
import { MaterialCard } from "@/components/MaterialCard";
import { HomeMaterialMarquee } from "./HomeMaterialMarquee";
import { HomeSearch } from "./HomeSearch";

const meta = {
  title: "Pages/Home/HomeSearch",
  component: HomeSearch,
  parameters: { layout: "fullscreen" },
  args: {
    children: (
      <HomeMaterialMarquee>
        {relatedMaterials.map((material) => (
          <MaterialCard
            key={material.id}
            variant="scroll"
            name={material.name}
            maker={material.manufacturer_name}
            rating={material.avg_rating ?? 0}
            reviewCount={material.review_count}
            categories={["微生物資材"]}
            official={material.manufacturer_verified_at !== null}
            imageSrc={material.imageUrl ?? undefined}
            href={`/materials/${material.id}`}
          />
        ))}
      </HomeMaterialMarquee>
    ),
  },
} satisfies Meta<typeof HomeSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
