import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("呼び出し側の ref に指定した行数の入力欄を渡す", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea label="本文" ref={ref} rows={4} defaultValue="1行目" />);
    const element = screen.getByRole("textbox", { name: "本文" });
    expect(ref.current).toBe(element);
    expect(element).toHaveAttribute("rows", "4");
  });
});
