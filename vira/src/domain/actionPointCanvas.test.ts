import { describe, expect, it } from "vitest";
import { createActionPoint } from "./actionPoints.ts";
import { placeActionPointAtWorld, sortedActionPointPlacementIds } from "./actionPointCanvas.ts";

describe("actionPointCanvas", () => {
  it("places action points on the canvas with stable ordering", () => {
    const bag = { nextActionPointId: 1, actionPoints: {} as Record<string, ReturnType<typeof createActionPoint>> };
    const a = createActionPoint(bag, "One");
    const b = createActionPoint(bag, "Two");
    const placements: Record<string, { x: number; y: number; order?: string }> = {};
    placeActionPointAtWorld(placements, bag.actionPoints, a.id, 100, 120);
    placeActionPointAtWorld(placements, bag.actionPoints, b.id, 200, 220);
    expect(sortedActionPointPlacementIds(placements, bag.actionPoints)).toEqual([a.id, b.id]);
    expect(placements[a.id]?.x).toBeGreaterThan(0);
  });
});
