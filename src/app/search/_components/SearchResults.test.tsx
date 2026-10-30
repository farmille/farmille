import { render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { expect, it } from "vitest";
import { SearchResults } from "./SearchResults";
import { storyCatalog } from "./story-fixtures";

it.each([
  ["reviews", ["根張りエース", "海藻アミノ 有機一番", "植物活力液"]],
  ["rating", ["海藻アミノ 有機一番", "根張りエース", "植物活力液"]],
  ["newest", ["植物活力液", "海藻アミノ 有機一番", "根張りエース"]],
] as const)("%s順で資材のリンクを並べる", (sort, expected) => {
  const catalog = {
    ...storyCatalog,
    materials: storyCatalog.materials.map((material, index) => ({
      ...material,
      avg_rating: [null, 3, 5][index] ?? null,
      created_at: ["2026-10-28", "2026-10-26", "2026-10-27"][index] ?? material.created_at,
    })),
  };

  render(
    <NuqsTestingAdapter>
      <SearchResults
        catalog={catalog}
        filters={[]}
        makerNames={[]}
        materialNames={[]}
        sort={sort}
        selected={[]}
        query=""
        keywordMatches={undefined}
        logic=""
      />
    </NuqsTestingAdapter>,
  );
  expect(
    screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href")?.startsWith("/materials/"))
      .map((link) => expected.find((name) => link.textContent?.includes(name))),
  ).toEqual(expected);
});
