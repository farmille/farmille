import { fn } from "storybook/test";
import { storyCatalog, storySearchCatalog } from "@/app/search/_components/story-fixtures";

export const getMaterialSavedCount = fn<
  typeof import("@/server/queries/catalog-search").getMaterialSavedCount
>(async () => 0).mockName("getMaterialSavedCount");

export const listSearchSuggestions = fn<
  typeof import("@/server/queries/catalog-search").listSearchSuggestions
>(async () => ({ ok: true, data: storySearchCatalog })).mockName("listSearchSuggestions");

export const getCatalogSearch = fn<
  typeof import("@/server/queries/catalog-search").getCatalogSearch
>(async () => storyCatalog).mockName("getCatalogSearch");
