import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearOnboarding, readOnboardingStep, writeOnboardingStep } from "@/lib/onboarding";

import { OnboardingTourWith } from "./OnboardingTour";

const USER_ID = "00000000-0000-4000-8000-000000000701";
const MATERIAL_PAGE = "/materials/00000000-0000-4000-8000-000000000101";
const REVIEW_FORM = `${MATERIAL_PAGE}/review/new`;

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
  bfcacheId: "test",
} satisfies AppRouterInstance;

/**
 * 案内を待つアカウントと、その印を消す処理。消す処理はテストから好きな時に終わらせる。
 * 消せたらアカウントの印とブラウザの進み具合が消え、以後は案内を待つアカウントではなくなる。
 */
function pendingAccount() {
  let pending = true;

  let settle: (finished: boolean) => void = () => {
    throw new Error("終了の処理が始まっていません。");
  };

  const finish = vi.fn(
    (userId: string) =>
      new Promise<boolean>((resolve) => {
        expect(userId).toBe(USER_ID);
        settle = (finished) => {
          if (finished) {
            pending = false;
            clearOnboarding(window.localStorage);
          }

          resolve(finished);
        };
      }),
  );

  return {
    findPendingUser: async () => (pending ? USER_ID : null),
    finish,
    settle: (finished: boolean) => settle(finished),
  };
}

function renderTour(account: ReturnType<typeof pendingAccount>) {
  render(
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={REVIEW_FORM}>
        <OnboardingTourWith findPendingUser={account.findPendingUser} finish={account.finish} />
      </PathnameContext.Provider>
    </AppRouterContext.Provider>,
  );
}

beforeEach(() => {
  writeOnboardingStep(window.localStorage, USER_ID, "finish");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("チュートリアルの最後のシート", () => {
  it("「閉じる」を押したら、印を消し終えるまでボタンを読み込み中にしてシートを残す", async () => {
    const user = userEvent.setup();
    const account = pendingAccount();
    renderTour(account);

    await user.click(await screen.findByRole("button", { name: "閉じる" }));

    const close = screen.getByRole("button", { name: "閉じる" });
    expect(close).toHaveAttribute("aria-busy", "true");
    expect(close).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText("チュートリアルはこれで完了です")).toBeInTheDocument();
    expect(screen.queryByText("ありがとうございました")).toBeNull();
    await user.click(close);
    expect(account.finish).toHaveBeenCalledTimes(1);
    await act(async () => account.settle(false));
    await waitFor(() => expect(close).not.toHaveAttribute("aria-busy"));
  });

  it("印を消し終えたら、お礼を出してから、その資材の資材ページへ移る", async () => {
    const user = userEvent.setup();
    const account = pendingAccount();
    renderTour(account);

    await user.click(await screen.findByRole("button", { name: "閉じる" }));
    await act(async () => account.settle(true));

    expect(await screen.findByText("ありがとうございました")).toBeInTheDocument();
    expect(screen.queryByText("チュートリアルはこれで完了です")).toBeNull();
    expect(router.push).not.toHaveBeenCalled();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith(MATERIAL_PAGE), {
      timeout: 3000,
    });
    expect(screen.queryByText("ありがとうございました")).toBeNull();
    expect(readOnboardingStep(window.localStorage, USER_ID)).toBeNull();
  });

  it("印を消せなかったときは、シートを残してもう一度押せるようにする", async () => {
    const user = userEvent.setup();
    const account = pendingAccount();
    renderTour(account);

    await user.click(await screen.findByRole("button", { name: "閉じる" }));
    await act(async () => account.settle(false));

    const close = screen.getByRole("button", { name: "閉じる" });
    await waitFor(() => expect(close).not.toHaveAttribute("aria-busy"));
    expect(close).not.toHaveAttribute("aria-disabled");
    expect(screen.queryByText("ありがとうございました")).toBeNull();
    expect(readOnboardingStep(window.localStorage, USER_ID)).toBe("finish");
    await user.click(close);
    expect(account.finish).toHaveBeenCalledTimes(2);
    await act(async () => account.settle(false));
    await waitFor(() => expect(close).not.toHaveAttribute("aria-busy"));
  });
});
