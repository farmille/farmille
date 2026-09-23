import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { PreparationNotice } from "./PreparationNotice";

it("案内全文を開いて連絡先を確認し、お知らせを閉じられる", async () => {
  const user = userEvent.setup();
  render(<PreparationNotice />);
  const summary = screen.getByText("詳細はこちら").closest("summary");
  const details = summary?.parentElement;
  expect(details).not.toHaveAttribute("open");
  await user.click(screen.getByText("詳細はこちら"));
  expect(details).toHaveAttribute("open");
  expect(screen.getByRole("link", { name: "info@farmille.com" })).toHaveAttribute(
    "href",
    "mailto:info@farmille.com",
  );
  await user.click(screen.getByRole("button", { name: "お知らせを閉じる" }));
  expect(screen.queryByRole("complementary", { name: "公開準備中のお知らせ" })).toBeNull();
});
