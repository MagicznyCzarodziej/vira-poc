// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createRef } from "react";
import { useDocument } from "../../store/index.ts";
import { zoomCanvas } from "./canvasCommands.ts";

describe("zoomCanvas", () => {
  beforeEach(() => {
    useDocument.getState().setViewport({ scrollLeft: 100, scrollTop: 80, zoom: 1 }, false);
  });

  it("uses rounded scroll offsets when zooming in", () => {
    const surface = document.createElement("div");
    Object.defineProperty(surface, "clientWidth", { value: 800 });
    Object.defineProperty(surface, "clientHeight", { value: 600 });
    surface.scrollLeft = 100;
    surface.scrollTop = 80;
    surface.getBoundingClientRect = () =>
      ({ width: 800, height: 600, left: 0, top: 0, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    const ref = createRef<HTMLDivElement>();
    ref.current = surface;

    zoomCanvas(ref, 1.15);

    const vp = useDocument.getState().canvasViewport;
    expect(vp.zoom).toBeCloseTo(1.15, 5);
    expect(Number.isInteger(vp.scrollLeft)).toBe(true);
    expect(Number.isInteger(vp.scrollTop)).toBe(true);
  });
});
