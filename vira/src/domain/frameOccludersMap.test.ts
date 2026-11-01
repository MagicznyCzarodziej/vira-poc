import { describe, expect, it } from "vitest";
import { frameOccludersLocalById } from "./frameOccludersMap.ts";

describe("frameOccludersLocalById", () => {
  it("maps each frame to occluders from higher z-order frames", () => {
    const placements = {
      f1: { x: 0, y: 0, width: 100, height: 100 },
      f2: { x: 50, y: 50, width: 100, height: 100 },
    };
    const map = frameOccludersLocalById(["f1", "f2"], placements);
    expect(map.get("f1")?.length).toBe(1);
    expect(map.get("f2")?.length).toBe(0);
  });
});
