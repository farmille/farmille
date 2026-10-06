import { applicationSellerPage } from "./_lib/access";
import { SellerAccessDenied } from "../_components/AccessDenied";
import { ApplicationsContent } from "./ApplicationsContent";
import { listCompanyApplications } from "@/server/company-applications";

export default async function ApplicationsPage() {
  if (!(await applicationSellerPage("/dashboard/applications"))) return <SellerAccessDenied />;
  const receipts = await listCompanyApplications();
  return <ApplicationsContent receipts={receipts} />;
}
