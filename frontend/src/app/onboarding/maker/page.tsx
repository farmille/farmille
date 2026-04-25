import { redirect } from "next/navigation";
import { getSession, getUser } from "@/lib/auth/server";
import { landingPathForRole } from "@/lib/auth/landing";
import { MakerForm } from "./_components/maker-form";

type StatusResponse = { role: string | null; has_profile: boolean };

export default async function OnboardingMakerPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("API_URL not configured");
  }

  const statusRes = await fetch(`${apiUrl}/v1/onboarding/status`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
  });

  if (!statusRes.ok) {
    throw new Error(`Failed to fetch onboarding status: ${statusRes.status}`);
  }

  const status = (await statusRes.json()) as StatusResponse;

  if (status.role === "unassigned" || status.role === null) {
    redirect("/onboarding");
  }
  if (status.role !== "maker") {
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
            メーカー情報の登録
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            企業情報を登録してください。登録後も変更可能です。
          </p>
        </div>
        <MakerForm />
      </div>
    </div>
  );
}
