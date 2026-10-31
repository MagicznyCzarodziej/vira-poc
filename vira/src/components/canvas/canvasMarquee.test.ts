// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  CANVAS_MARQUEE_THRESHOLD_PX,
  clientRectsIntersect,
  normalizeClientRect,
  placedIdsInMarquee,
  positionMarqueeElement,
  shouldStartCanvasMarquee,
} from "./canvasMarquee.ts";

describe("canvasMarquee", () => {
  it("normalizes client rects", () => {
    expect(normalizeClientRect(10, 20, 5, 30)).toEqual({
      left: 5,
      top: 20,
      right: 10,
      bottom: 30,
    });
  });

  it("detects intersection", () => {
    const a = normalizeClientRect(0, 0, 10, 10);
    const b = normalizeClientRect(5, 5, 15, 15);
    expect(clientRectsIntersect(a, b)).toBe(true);
    expect(clientRectsIntersect(a, normalizeClientRect(20, 20, 30, 30))).toBe(false);
  });

  it("requires moving past the marquee threshold", () => {
    expect(shouldStartCanvasMarquee(0, 0, 3, 0, CANVAS_MARQUEE_THRESHOLD_PX)).toBe(false);
    expect(shouldStartCanvasMarquee(0, 0, 5, 0, CANVAS_MARQUEE_THRESHOLD_PX)).toBe(true);
  });

  it("returns placed ids intersecting the marquee", () => {
    document.body.innerHTML = `
      <div id="surface">
        <div data-canvas-placed="item-1"></div>
        <div data-canvas-placed="item-2"></div>
      </div>
    `;
    const surface = document.getElementById("surface")!;
    const rects: Record<string, DOMRect> = {
      "item-1": { left: 10, top: 10, right: 50, bottom: 50 } as DOMRect,
      "item-2": { left: 200, top: 200, right: 240, bottom: 240 } as DOMRect,
    };
    for (const el of surface.querySelectorAll<HTMLElement>("[data-canvas-placed]")) {
      const id = el.dataset.canvasPlaced!;
      el.getBoundingClientRect = () => rects[id]!;
    }
    const marquee = normalizeClientRect(0, 0, 50, 50);
    expect(placedIdsInMarquee(surface, marquee)).toEqual(["item-1"]);
  });

  it("includes action points that use data-canvas-placed", () => {
    document.body.innerHTML = `
      <div id="surface">
        <div class="canvas-placed-action-point" data-canvas-placed="ap-1"></div>
        <div data-canvas-placed="item-1"></div>
      </div>
    `;
    const surface = document.getElementById("surface")!;
    const rects: Record<string, DOMRect> = {
      "ap-1": { left: 10, top: 10, right: 50, bottom: 50 } as DOMRect,
      "item-1": { left: 200, top: 200, right: 240, bottom: 240 } as DOMRect,
    };
    for (const el of surface.querySelectorAll<HTMLElement>("[data-canvas-placed]")) {
      const id = el.dataset.canvasPlaced!;
      el.getBoundingClientRect = () => rects[id]!;
    }
    const marquee = normalizeClientRect(0, 0, 50, 50);
    expect(placedIdsInMarquee(surface, marquee)).toEqual(["ap-1"]);
  });

  it("positions the marquee overlay in viewport coordinates", () => {
    const el = document.createElement("div");
    positionMarqueeElement(el, normalizeClientRect(120, 80, 220, 180));
    expect(el.style.left).toBe("120px");
    expect(el.style.top).toBe("80px");
    expect(el.style.width).toBe("100px");
    expect(el.style.height).toBe("100px");
  });
});
