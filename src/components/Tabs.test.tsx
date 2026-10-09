import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Tabs } from "./Tabs";

afterEach(cleanup);

function EditorTabs() {
  const [tab, setTab] = useState<"write" | "preview">("write");
  return (
    <Tabs
      aria-label="本文エディタ"
      value={tab}
      onValueChange={setTab}
      tabs={[
        { value: "write", label: "編集", panel: <p>編集欄</p> },
        { value: "preview", label: "プレビュー", panel: <p>プレビュー欄</p> },
      ]}
    />
  );
}

describe("Tabs", () => {
  it("選んだタブのパネルだけを出す", () => {
    render(<EditorTabs />);
    expect(screen.getByRole("tablist", { name: "本文エディタ" })).toBeDefined();
    expect(screen.getByRole("tab", { name: "編集" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("編集欄")).toBeDefined();

    fireEvent.click(screen.getByRole("tab", { name: "プレビュー" }));
    expect(screen.getByRole("tab", { name: "プレビュー" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(screen.getByRole("tabpanel").textContent).toBe("プレビュー欄");
    expect(screen.queryByText("編集欄")).toBeNull();
  });
});
