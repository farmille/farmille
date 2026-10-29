import { describe, expect, it } from "vitest";

import { fail, succeed, type Result } from "@/server/result";

import { withdrawMember, type WithdrawalSteps } from "./withdrawal";

const account = { userId: "00000000-0000-4000-8000-000000000701", email: "farmer@example.test" };

type StepName = keyof WithdrawalSteps;

type ResultStep = Exclude<StepName, "sendCompletionEmail">;

/** 呼ばれた順を記録し、指定した手順だけ失敗させる。 */
function recordingSteps(
  failures: Partial<Record<ResultStep, Result<null>>> & { sendCompletionEmail?: false } = {},
) {
  const calls: string[] = [];
  const result = (name: ResultStep): Result<null> => failures[name] ?? succeed(null);
  const steps: WithdrawalSteps = {
    async verifyPassword(target, password) {
      calls.push(`verifyPassword:${target.email}:${password}`);
      return result("verifyPassword");
    },
    async withdrawProfile(userId) {
      calls.push(`withdrawProfile:${userId}`);
      return result("withdrawProfile");
    },
    async removeAvatars(userId) {
      calls.push(`removeAvatars:${userId}`);
      return result("removeAvatars");
    },
    async deleteAuthUser(userId) {
      calls.push(`deleteAuthUser:${userId}`);
      return result("deleteAuthUser");
    },
    async sendCompletionEmail(email) {
      calls.push(`sendCompletionEmail:${email}`);
      return failures.sendCompletionEmail !== false;
    },
    async signOut() {
      calls.push("signOut");
      return result("signOut");
    },
  };
  return { steps, calls };
}

const FULL_ORDER = [
  "verifyPassword:farmer@example.test:current-password",
  "withdrawProfile:00000000-0000-4000-8000-000000000701",
  "removeAvatars:00000000-0000-4000-8000-000000000701",
  "deleteAuthUser:00000000-0000-4000-8000-000000000701",
  "sendCompletionEmail:farmer@example.test",
  "signOut",
];

describe("退会の手順", () => {
  it("パスワードの確認、DB、アイコン、Auth の論理削除、完了メール、ログアウトの順に進む", async () => {
    const { steps, calls } = recordingSteps();
    expect(await withdrawMember(account, "current-password", steps)).toEqual(succeed(null));
    expect(calls).toEqual(FULL_ORDER);
  });

  it("パスワードが違えば、何も消さずに止まる", async () => {
    const { steps, calls } = recordingSteps({ verifyPassword: fail("invalid_credentials") });
    expect(await withdrawMember(account, "current-password", steps)).toEqual(
      fail("invalid_credentials"),
    );
    expect(calls).toEqual([FULL_ORDER[0]]);
  });

  it("Auth の論理削除で止まっても、もう一度押すと最初から最後まで進む", async () => {
    const first = recordingSteps({ deleteAuthUser: fail("internal") });
    expect(await withdrawMember(account, "current-password", first.steps)).toEqual(
      fail("internal"),
    );
    expect(first.calls).toEqual(FULL_ORDER.slice(0, 4));

    const retry = recordingSteps();
    expect(await withdrawMember(account, "current-password", retry.steps)).toEqual(succeed(null));
    expect(retry.calls).toEqual(FULL_ORDER);
  });

  it("DB の処理で止まったら、ログインを残したまま Auth のユーザーを消さない", async () => {
    const { steps, calls } = recordingSteps({ withdrawProfile: fail("internal") });
    expect(await withdrawMember(account, "current-password", steps)).toEqual(fail("internal"));
    expect(calls).toEqual(FULL_ORDER.slice(0, 2));
  });

  it("Auth のユーザーを消したあとのメールとログアウトの失敗では、退会を失敗にしない", async () => {
    const { steps, calls } = recordingSteps({
      sendCompletionEmail: false,
      signOut: fail("internal"),
    });
    expect(await withdrawMember(account, "current-password", steps)).toEqual(succeed(null));
    expect(calls).toEqual(FULL_ORDER);
  });
});
