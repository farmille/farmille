import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { errorMessageJa } from "@/server/errors";
import { getMaterial, type MaterialDetail } from "@/server/queries/materials";
import type { Result } from "@/server/result";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isMaterialId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

const getCachedMaterial = cache(async (id: string): Promise<Result<MaterialDetail>> => {
  if (!isMaterialId(id)) {
    return { ok: false, error: "not_found" };
  }

  return getMaterial(id);
});

export async function loadMaterialOrNotFound(id: string): Promise<MaterialDetail> {
  const result = await getCachedMaterial(id);

  if (!result.ok) {
    if (result.error === "not_found") {
      notFound();
    }

    throw new Error(errorMessageJa[result.error]);
  }

  return result.data;
}

export function materialMetadata(
  material: MaterialDetail,
  options: { titleSuffix?: string; description?: string } = {},
): Metadata {
  const title = options.titleSuffix
    ? `${material.name}${options.titleSuffix}｜Farmille`
    : `${material.name}｜Farmille`;
  const description =
    options.description ??
    material.description ??
    `${material.name}の製品情報、使用レポート、農家のレビューを確認できます。`;
  const primaryImage = material.images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      type: "website",
      title,
      description,
      ...(primaryImage === undefined ? {} : { images: [{ url: primaryImage }] }),
    },
  };
}
