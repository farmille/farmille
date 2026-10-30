import * as Sentry from "@sentry/nextjs";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ErrorPage } from "./ErrorPage";

const props = {
  onRetry: () => {},
  title: "読み込めませんでした",
  description: "時間をおいて試してください",
};

const sent: string[] = [];

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://key@example.test/1");
  sent.length = 0;
  Sentry.init({
    dsn: "https://key@example.test/1",
    defaultIntegrations: false,
    beforeSend: (event) => {
      sent.push(event.exception?.values?.[0]?.value ?? "");

      return null;
    },
  });
});

afterEach(async () => {
  cleanup();
  vi.unstubAllEnvs();
  await Sentry.close();
});

it("再試行が別のエラーで失敗したときも、そのエラーを送る", async () => {
  const view = render(<ErrorPage {...props} error={new Error("first")} />);
  const second = new Error("second");
  view.rerender(<ErrorPage {...props} error={second} />);
  view.rerender(<ErrorPage {...props} error={second} />);
  await Sentry.flush();
  expect(sent).toEqual(["first", "second"]);
});
