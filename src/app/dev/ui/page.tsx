import { notFound } from "next/navigation";
import { UiCatalog } from "./UiCatalog";

export default function UiKitPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <UiCatalog />;
}
