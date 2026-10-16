import { describe, expect, it } from "vitest";

import { poseAt, spinAngle } from "./bottle-scene";

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

describe("ボトルの姿勢", () => {
  it("登場の動きは行き過ぎず、立った姿勢から落ち着いたあとの傾きと高さの間に収まる", () => {
    const steady = Array.from({ length: 1_000 }, (_, index) => poseAt(10_000 + index * FRAME_MS));
    const lean = steady[0].lean;
    const highest = Math.max(...steady.map((pose) => pose.lift));
    const start = poseAt(0);
    expect(start.lean).toBe(0);
    expect(steady.every((pose) => pose.lean === lean)).toBe(true);

    for (let elapsed = 0; elapsed < 10_000; elapsed += FRAME_MS) {
      const pose = poseAt(elapsed);
      expect(pose.lean).toBeGreaterThanOrEqual(0);
      expect(pose.lean).toBeLessThanOrEqual(lean);
      expect(pose.lift).toBeGreaterThanOrEqual(start.lift);
      expect(pose.lift).toBeLessThanOrEqual(highest);
    }
  });
});
