import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { createPageMetadata } from "@/lib/seo";
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

export function materialDescription(material: MaterialDetail): string {
  return (
    material.description ??
    `${material.name}の製品情報、実証詳細レポート、農家の感想口コミを確認できます。`
  );
}

export function materialMetadata(
  material: MaterialDetail,
  options: { titleSuffix?: string; description?: string; pathSuffix?: string } = {},
): Metadata {
  const title = options.titleSuffix ? `${material.name}${options.titleSuffix}` : material.name;
  const description = options.description ?? materialDescription(material);
  const primaryImage = material.images[0]?.url;

  return createPageMetadata({
    title,
    description,
    path: `/materials/${material.id}${options.pathSuffix ?? ""}`,
    imageUrls: primaryImage === undefined ? undefined : [primaryImage],
  });
}
