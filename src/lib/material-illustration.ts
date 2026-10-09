import type { Database } from "@/types/database.types";

type ContainerTypeId = Database["public"]["Tables"]["materials"]["Row"]["container_type_id"];

export function materialIllustrationUrl(containerTypeId: ContainerTypeId): string | null {
  return containerTypeId === null || containerTypeId === 0
    ? null
    : `/images/container-shapes/${containerTypeId}.png`;
}
