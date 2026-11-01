import { describe, expect, it } from "vitest";
import { frameRectsIntersect, localOccluderRectsForFrame } from "./frameBorderOcclusion.ts";

describe("frameBorderOcclusion", () => {
  it("detects overlapping frame rects", () => {
    expect(
      frameRectsIntersect({ x: 0, y: 0, width: 100, height: 100 }, { x: 50, y: 50, width: 100, height: 100 }),
    ).toBe(true);
    expect(
      frameRectsIntersect({ x: 0, y: 0, width: 100, height: 100 }, { x: 200, y: 0, width: 50, height: 50 }),
    ).toBe(false);
  });

  it("maps world occluders into host-local space", () => {
    const host = { x: 100, y: 100, width: 400, height: 300 };
    const local = localOccluderRectsForFrame(host, [
      { x: 250, y: 180, width: 200, height: 120 },
      { x: 900, y: 0, width: 100, height: 100 },
    ]);
    expect(local).toEqual([{ x: 150, y: 80, width: 200, height: 120 }]);
  });
});
