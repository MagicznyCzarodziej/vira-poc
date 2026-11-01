import { describe, expect, it } from "vitest";
import { boundsIntersectViewport, isPointPlacementVisible } from "./canvasVisibility.ts";

describe("canvasVisibility", () => {
  const view = {
    scrollLeft: 100,
    scrollTop: 50,
    zoom: 1,
    clientWidth: 800,
    clientHeight: 600,
    marginScreenPx: 0,
  };

  it("includes placements inside the viewport", () => {
    expect(isPointPlacementVisible(200, 100, view)).toBe(true);
  });

  it("excludes placements far outside", () => {
    expect(isPointPlacementVisible(5000, 5000, view)).toBe(false);
  });

  it("respects margin buffer", () => {
    expect(
      boundsIntersectViewport(
        { x: 950, y: 0, width: 10, height: 10 },
        { ...view, marginScreenPx: 200 },
      ),
    ).toBe(true);
  });
});
