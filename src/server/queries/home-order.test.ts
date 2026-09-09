import { describe, expect, it } from "vitest";
import { rankHomeCandidates } from "./home-order";
describe("ホームの投稿ランキング", () => {
  const candidates = [
    { id: "new", created_at: "2026-09-09" },
    { id: "old", created_at: "2026-09-01" },
    { id: "zero", created_at: "2026-09-08" },
  ];
  it("集計票数が多い順に並べる", () => {
    expect(
      rankHomeCandidates(
        candidates,
        new Map([
          ["old", 2],
          ["new", 1],
        ]),
        3,
      ),
    ).toEqual(["old", "new", "zero"]);
  });
  it("同点は日時、日時も同じならIDで安定化する", () => {
    expect(
      rankHomeCandidates([...candidates, { id: "aaa", created_at: "2026-09-09" }], new Map(), 4),
    ).toEqual(["aaa", "new", "zero", "old"]);
  });
  it("指定した件数で切り、入力を変更しない", () => {
    expect(rankHomeCandidates(candidates, new Map([["old", 2]]), 1)).toEqual(["old"]);
    expect(candidates.map((row) => row.id)).toEqual(["new", "old", "zero"]);
  });
  it("公開投稿がなければ空配列を返す", () => {
    expect(rankHomeCandidates([], new Map(), 4)).toEqual([]);
  });
});
