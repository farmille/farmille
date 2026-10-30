import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import * as actions from "@/app/company-requests/actions";
import { emptyContact } from "@/app/company-requests/_components/ContactFields";
import { NewApplicationForm } from "./NewApplicationForm";

afterEach(() => vi.restoreAllMocks());

const props = { defaults: emptyContact, recipient: "contact@example.test" };
const retryButton = () => screen.findByRole("button", { name: "もう一度試す" });

it("StrictModeでも入力開始のintentは1回だけ作る", async () => {
  const begin = vi
    .spyOn(actions, "beginApplication")
    .mockResolvedValue({ ok: false, error: "internal" });

  render(
    <StrictMode>
      <NewApplicationForm kind="registration" {...props} />
    </StrictMode>,
  );
  await retryButton();
  expect(begin).toHaveBeenCalledExactlyOnceWith("registration");
});

it("作成に失敗したら再試行できる", async () => {
  const begin = vi
    .spyOn(actions, "beginApplication")
    .mockResolvedValue({ ok: false, error: "internal" });

  render(<NewApplicationForm kind="transfer_out" {...props} />);
  fireEvent.click(await retryButton());
  await waitFor(() => expect(begin).toHaveBeenCalledTimes(2));
  expect(begin).toHaveBeenLastCalledWith("transfer_out");
});
