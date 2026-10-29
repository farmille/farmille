import { describe, expect, it } from "vitest";

import { initialPostsTab } from "./posts-tab";

describe("initialPostsTab", () => {
  it("実証詳細レポートが0件で感想口コミがあれば、感想口コミを開く", () => {
    expect(initialPostsTab(undefined, { reports: 0, reviews: 1 })).toBe("reviews");
  });

  it("両方0件と両方あるときは、実証詳細レポートを開く", () => {
    expect(initialPostsTab(undefined, { reports: 0, reviews: 0 })).toBe("reports");
    expect(initialPostsTab(undefined, { reports: 2, reviews: 3 })).toBe("reports");
  });

  it("実証詳細レポートだけあるときは、実証詳細レポートを開く", () => {
    expect(initialPostsTab(undefined, { reports: 1, reviews: 0 })).toBe("reports");
  });

  it("URL で選ばれたタブは、件数によらずそのまま開く", () => {
    expect(initialPostsTab("reports", { reports: 0, reviews: 1 })).toBe("reports");
    expect(initialPostsTab("reviews", { reports: 1, reviews: 0 })).toBe("reviews");
  });

  it("知らない値は、選ばれていないものとして扱う", () => {
    expect(initialPostsTab("drafts", { reports: 0, reviews: 1 })).toBe("reviews");
  });
});
