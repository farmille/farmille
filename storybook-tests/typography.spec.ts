import { expect, test } from "@playwright/test";

for (const width of [375, 1440]) {
  test(`英数字の送り幅と日本語の字間を維持する（${width}px）`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/iframe.html?id=design-system-tokens--mixed-script-spacing&viewMode=story");
    await expect(page.getByRole("heading", { name: "Farmille 資材レビュー 2026" })).toBeVisible();
    const measurements = await page.evaluate(async () => {
      const results = [];
      for (const weight of [400, 500, 600, 700, 800]) {
        await document.fonts.load(`${weight} 16px "Farmille Gen Latin"`, "ABCxyzN0123456789");
        await document.fonts.load(`${weight} 16px "Gen Interface JP"`, "ABCxyzN0123456789日本語");
        for (const text of ["ABCxyzN0123456789", "日本語", "ABC資材を10kg使用", "111999000"]) {
          for (const numeric of ["normal", "tabular-nums"]) {
            const sample = document.createElement("span");
            Object.assign(sample.style, {
              position: "absolute",
              whiteSpace: "nowrap",
              fontSize: "16px",
              fontWeight: String(weight),
              letterSpacing: "0.04em",
              textAutospace: "normal",
              fontVariantNumeric: numeric,
            });
            sample.textContent = text;
            document.body.appendChild(sample);
            sample.style.fontFamily = '"Gen Interface JP"';
            const original = sample.getBoundingClientRect().width;
            sample.style.fontFamily = '"Farmille Gen Latin", "Gen Interface JP"';
            const adjusted = sample.getBoundingClientRect().width;
            sample.remove();
            results.push({
              weight,
              text,
              numeric,
              delta: original - adjusted,
              expected: (text.match(/[A-Za-z0-9]/g)?.length ?? 0) * (41 / 2048) * 16,
            });
          }
        }
      }
      return results;
    });
    for (const result of measurements) {
      expect(Math.abs(result.delta - result.expected), JSON.stringify(result)).toBeLessThan(0.06);
    }
    const input = page.getByRole("textbox", { name: "資材名", exact: true });
    await input.fill("トマトABC123");
    await input.press("End");
    await input.pressSequentially("xyz");
    await expect(input).toHaveValue("トマトABC123xyz");
    const textarea = page.getByRole("textbox", { name: "使用メモ", exact: true });
    await textarea.fill("使用量10kg\nABC資材の記録");
    await expect(textarea).toHaveValue("使用量10kg\nABC資材の記録");
    await expect(input).toHaveCSS("letter-spacing", "0.64px");
    await expect(input).toHaveCSS("font-family", /Farmille Gen Latin/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  });
}
