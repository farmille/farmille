import { fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { Textarea } from "./Textarea";

describe("Textarea の ref", () => {
  it("呼び出し側の ref に欄が入り、伸びる欄の自動の高さ合わせも続けて動く", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea label="本文" size="document" ref={ref} defaultValue="1行目" />);
    const element = ref.current;
    expect(element).toBeInstanceOf(HTMLTextAreaElement);
    if (element === null) throw new Error("ref に欄が入っていません。");
    Object.defineProperty(element, "scrollHeight", { configurable: true, value: 96 });
    fireEvent.input(element, { target: { value: "1行目\n2行目\n3行目" } });
    expect(element.style.height).toBe("96px");
  });
});
