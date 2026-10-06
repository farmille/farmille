import "../../../_mock/dashboard.css";

import Link from "next/link";
import * as v from "valibot";
import { applicationSellerPage } from "../_lib/access";
import { SellerAccessDenied } from "../../_components/AccessDenied";
import { MockPageShell } from "@/app/_mock/MockPageShell";
import { applicationKindSchema } from "@/lib/company-application";
import { applicationCopy } from "@/lib/company-application-copy";
import { readCompanyApplication } from "@/server/company-applications";
import { ApplicationReceipt } from "@/app/company-requests/_components/ApplicationReceipt";

/** 見本 S.appDone（送信完了）の見出しの下に、本番の受付票（印刷・控えメールの再送）を置く。 */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await applicationSellerPage(`/dashboard/applications/${id}`)))
    return <SellerAccessDenied />;
  const receipt = await readCompanyApplication(id);
  const kind = v.safeParse(applicationKindSchema, receipt.application.kind);
  return (
    <MockPageShell title="申請受付票" backHref="/dashboard/applications">
      <div className="dash-narrow">
        <div className="done-wrap dash-done">
          <div className="done-check" aria-hidden="true">
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M5 12l5 5 9-11" />
            </svg>
          </div>
          <h1 style={{ fontSize: 20 }}>ご申請を受け付けました</h1>
          {kind.success ? <p>{applicationCopy[kind.output].title}</p> : null}
          <div className="done-actions">
            <Link className="btn btn-ghost" href="/dashboard/applications">
              各種お手続きへ戻る
            </Link>
          </div>
        </div>
        <div className="card pad">
          <ApplicationReceipt receipt={receipt} />
        </div>
      </div>
    </MockPageShell>
  );
}
