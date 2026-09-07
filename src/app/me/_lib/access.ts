import { redirect } from "next/navigation";

import {
  getSessionUser,
  requireGeneralUser,
  type AccountType,
  type GeneralSession,
} from "@/server/auth";
import { errorMessageJa } from "@/server/errors";

export type MeAccess =
  | { kind: "general"; session: GeneralSession }
  | { kind: "other"; accountType: AccountType | null };

/** `/me` 配下の共通ガード。一般以外は画面で誘導文を出す。 */
export async function resolveMeAccess(nextPath: string): Promise<MeAccess> {
  const session = await requireGeneralUser();

  if (session.ok) {
    return { kind: "general", session: session.data };
  }

  if (session.error === "unauthorized") {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (session.error !== "forbidden") {
    throw new Error(errorMessageJa[session.error]);
  }

  const user = await getSessionUser();

  return { kind: "other", accountType: user?.accountType ?? null };
}
