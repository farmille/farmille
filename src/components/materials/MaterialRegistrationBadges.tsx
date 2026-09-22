import { Badge } from "@/components/Badge";
import { MATERIAL_REGISTRATION_KINDS, type MaterialPageContent } from "@/lib/material-page-editor";
import { css } from "../../../styled-system/css";

export function MaterialRegistrationBadges({
  registrations,
  certifications,
}: Pick<MaterialPageContent, "registrations" | "certifications">) {
  if (registrations.length === 0 && certifications.length === 0) return <>−</>;
  return (
    <div className={css({ display: "flex", flexWrap: "wrap", gap: "2" })}>
      {MATERIAL_REGISTRATION_KINDS.filter((kind) =>
        registrations.some((entry) => entry.kind === kind.value),
      ).map((kind) => (
        <Badge key={kind.value}>{kind.label}</Badge>
      ))}
      {certifications.map((title, index) => (
        <span key={index}>{title}</span>
      ))}
    </div>
  );
}
