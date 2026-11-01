// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { applyCanvasWorldScale, scrollForZoomAtPoint } from "./canvasWorldZoom.ts";

describe("applyCanvasWorldScale", () => {
  it("sets transform and zoom variable for CSS compensation", () => {
    const world = document.createElement("div");
    applyCanvasWorldScale(world, 0.5);
    expect(world.style.transform).toBe("scale(0.5)");
    expect(world.style.getPropertyValue("--canvas-zoom")).toBe("0.5");
  });

  it("ends on the new scale after a zoom change", () => {
    const world = document.createElement("div");
    applyCanvasWorldScale(world, 1);
    applyCanvasWorldScale(world, 1.25);
    expect(world.style.transform).toBe("scale(1.25)");
    expect(world.dataset.canvasZoom).toBe("1.25");
  });

  it("does not reset transform on first apply", () => {
    const world = document.createElement("div");
    applyCanvasWorldScale(world, 1);
    expect(world.style.transform).toBe("scale(1)");
  });

  it("skips reflow reset when zoom is unchanged", () => {
    const world = document.createElement("div");
    applyCanvasWorldScale(world, 1.15);
    world.style.transform = "scale(1.15) rotate(1deg)";
    applyCanvasWorldScale(world, 1.15);
    expect(world.style.transform).toBe("scale(1.15)");
  });
});

describe("scrollForZoomAtPoint", () => {
  it("rounds scroll to whole pixels", () => {
    expect(scrollForZoomAtPoint(100, 200, 50.4, 60.6, 1.25)).toEqual({
      scrollLeft: 75,
      scrollTop: 189,
    });
  });
});
