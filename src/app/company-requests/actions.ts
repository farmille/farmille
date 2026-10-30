"use server";

import type {
  ApplicationSubmission,
  ReceiptAccess,
  EvidenceReservation,
  SubmittableKind,
} from "@/lib/company-application";
import { applicationResult } from "@/server/company-application-auth";
import { beginCompanyApplication, saveCompanyApplication } from "@/server/company-applications";
import { requestReceiptAccess } from "@/server/company-application-access";
import {
  reserveApplicationEvidence,
  finalizeApplicationEvidence,
  removeApplicationEvidence,
  cleanupExpiredApplicationUploads,
} from "@/server/company-application-evidence";
import { sendApplicationReceipt } from "@/server/accounts/application-email";

export async function beginApplication(kind: SubmittableKind) {
  return applicationResult(async () => {
    await cleanupExpiredApplicationUploads();

    return (await beginCompanyApplication(kind)).id;
  });
}

export async function submitApplication(input: ApplicationSubmission) {
  return applicationResult(async () => {
    const id = await saveCompanyApplication(input);

    try {
      await sendApplicationReceipt(id);
    } catch {
      console.error("[company-application] 受付控えの配送を完了できませんでした。");
    }

    return id;
  });
}

export async function retryApplicationMail(id: string) {
  return applicationResult(async () => {
    await sendApplicationReceipt(id);

    return true;
  });
}

export async function requestReceiptVerification(input: ReceiptAccess) {
  return applicationResult(() => requestReceiptAccess(input));
}

export async function reserveEvidence(input: EvidenceReservation) {
  return applicationResult(() => reserveApplicationEvidence(input));
}

export async function finalizeEvidence(id: string) {
  return applicationResult(() => finalizeApplicationEvidence(id));
}

export async function removeEvidence(id: string) {
  return applicationResult(() => removeApplicationEvidence(id));
}
