import * as v from "valibot";
import { toResponse } from "@/server/result";
import { downloadApplicationEvidence } from "@/server/company-application-evidence";
import { applicationResult } from "@/server/company-application-auth";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await applicationResult(() => downloadApplicationEvidence(id));
  if (!result.ok) return toResponse(result, v.string());
  return new Response(null, {
    status: 302,
    headers: {
      Location: result.data,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
