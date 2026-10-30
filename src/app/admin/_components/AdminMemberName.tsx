import Link from "next/link";

import { formatDateJa } from "@/components/format-date";
import { WITHDRAWN_MEMBER_NAME } from "@/lib/public-profile-label";
import type { AdminMember } from "@/server/admin/members";

import { css } from "../../../../styled-system/css";

const withdrawnStyle = css({ color: "text.muted" });

/** 在籍中の会員は公開プロフィールへのリンクにし、退会済みの会員は退会した日を添える。 */
export function AdminMemberName({
  member,
  linkClassName,
}: {
  member: AdminMember;
  linkClassName: string;
}) {
  if (member.withdrawnAt !== null) {
    return (
      <span className={withdrawnStyle}>
        {WITHDRAWN_MEMBER_NAME}（{formatDateJa(member.withdrawnAt)}に退会）
      </span>
    );
  }

  return (
    <Link className={linkClassName} href={`/users/${member.userId}`}>
      {member.handle}
    </Link>
  );
}
