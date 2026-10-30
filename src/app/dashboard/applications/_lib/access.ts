import { redirect } from "next/navigation";
import { ApplicationError, approvedApplicationSeller } from "@/server/company-application-auth";

export async function applicationSellerPage(next: string) {
  try {
    return await approvedApplicationSeller();
  } catch (error) {
    if (!(error instanceof ApplicationError)) throw error;

    if (error.code === "unauthorized") redirect(`/sellers/login?next=${encodeURIComponent(next)}`);

    if (error.code === "forbidden") return null;
    throw error;
  }
}
