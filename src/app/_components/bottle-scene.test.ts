import { describe, expect, it } from "vitest";

import { spinAngle } from "./bottle-scene";

const FRAME_MS = 16;

function speedAt(elapsedMs: number): number {
  return (spinAngle(elapsedMs + FRAME_MS) - spinAngle(elapsedMs)) / FRAME_MS;
}

describe("ボトルの回転", () => {
  it("同じ向きに回り続け、逆回りや停止をしない", () => {
    for (let elapsed = 0; elapsed < 30_000; elapsed += FRAME_MS) {
      expect(spinAngle(elapsed + FRAME_MS)).toBeGreaterThan(spinAngle(elapsed));
    }
  });

  it("登場直後は速く回り、減速したあとは一定の速さで回る", () => {
    const steady = speedAt(10_000);
    expect(speedAt(0)).toBeGreaterThan(steady * 3);
    for (const elapsed of [5_000, 15_000, 60_000]) {
      expect(speedAt(elapsed)).toBeCloseTo(steady, 10);
    }
  });
});
