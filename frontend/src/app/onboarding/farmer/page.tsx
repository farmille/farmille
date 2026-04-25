import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { FarmerForm } from "./_components/farmer-form";
import type {
  CategoryL1,
  CategoryL2,
  Crop,
} from "./_components/crop-picker";

type StatusResponse = { role: string | null; has_profile: boolean };
type CropsResponse = {
  categories_l1: CategoryL1[];
  categories_l2: CategoryL2[];
  crops: Crop[];
};

export default async function OnboardingFarmerPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const headers = {
    Authorization: `Bearer ${session.access_token}`,
  };

  const [statusRes, cropsRes] = await Promise.all([
    fetch(`${apiUrl}/v1/onboarding/status`, { headers, cache: "no-store" }),
    fetch(`${apiUrl}/v1/onboarding/crops`, { headers, cache: "no-store" }),
  ]);

  if (!statusRes.ok) {
    throw new Error(`Failed to fetch onboarding status: ${statusRes.status}`);
  }
  if (!cropsRes.ok) {
    throw new Error(`Failed to fetch crops: ${cropsRes.status}`);
  }

  const status = (await statusRes.json()) as StatusResponse;
  const cropsData = (await cropsRes.json()) as CropsResponse;

  if (status.role === "unassigned" || status.role === null) {
    redirect("/onboarding");
  }
  if (status.role !== "farmer") {
    redirect(landingPathForRole(status.role));
  }
  if (status.has_profile) {
    redirect("/onboarding/complete");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-background px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Farmille
        </h1>
      </div>
      <div className="w-full max-w-xl space-y-6 rounded-md border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            農家情報の登録
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            所在地と栽培されている作目を教えてください。登録後も変更可能です。
          </p>
        </div>
        <FarmerForm
          crops={cropsData.crops}
          categoriesL1={cropsData.categories_l1}
          categoriesL2={cropsData.categories_l2}
        />
      </div>
    </div>
  );
}
