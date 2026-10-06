import { afterEach, describe, expect, it, vi } from "vitest";

import { recordViewEvents, type ViewEventsInsert } from "./view-events";

type InsertedRows = Parameters<ViewEventsInsert<string>>[0];

function memoryInsert(error: string | null = null) {
  const calls: InsertedRows[] = [];
  const insert: ViewEventsInsert<string> = async (rows) => {
    calls.push(rows);
    return { error };
  };
  return { insert, calls };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("recordViewEvents", () => {
  it("表示した口コミごとに1行を、1回の insert でまとめて追記する", async () => {
    const { insert, calls } = memoryInsert();

    const result = await recordViewEvents({
      targetType: "review",
      targetIds: ["review-a", "review-b", "review-c"],
      viewerUserId: "user-1",
      insert,
    });

    expect(result).toEqual({ ok: true, data: null });
    expect(calls).toEqual([
      [
        { target_type: "review", target_id: "review-a", viewer_user_id: "user-1" },
        { target_type: "review", target_id: "review-b", viewer_user_id: "user-1" },
        { target_type: "review", target_id: "review-c", viewer_user_id: "user-1" },
      ],
    ]);
  });

  it("閲覧者を省略すると viewer_user_id は null になる", async () => {
    const { insert, calls } = memoryInsert();

    await recordViewEvents({ targetType: "review", targetIds: ["review-a"], insert });

    expect(calls).toEqual([
      [{ target_type: "review", target_id: "review-a", viewer_user_id: null }],
    ]);
  });

  it("対象が空なら insert しない", async () => {
    const { insert, calls } = memoryInsert();

    const result = await recordViewEvents({ targetType: "review", targetIds: [], insert });

    expect(result).toEqual({ ok: true, data: null });
    expect(calls).toEqual([]);
  });

  it("insert の失敗はログに残して internal を返す", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { insert } = memoryInsert("denied");

    const result = await recordViewEvents({
      targetType: "review",
      targetIds: ["review-a"],
      insert,
    });

    expect(result).toEqual({ ok: false, error: "internal" });
    expect(consoleError).toHaveBeenCalledWith(
      "[server/queries/view-events] 閲覧イベントの一括記録に失敗",
      "denied",
    );
  });

  it("空の ID が混じっていたら例外にする", async () => {
    const { insert, calls } = memoryInsert();

    await expect(
      recordViewEvents({ targetType: "review", targetIds: ["review-a", ""], insert }),
    ).rejects.toThrow("targetIds に空の値は含められません。");
    expect(calls).toEqual([]);
  });
});
