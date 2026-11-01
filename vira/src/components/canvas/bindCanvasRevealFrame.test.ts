// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/useDocument.ts";
import { bindCanvasReveal } from "./bindCanvasReveal.ts";

describe("bindCanvasReveal frames", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("pans the viewport when revealing a frame id", () => {
    document.body.innerHTML = `
      <div data-canvas-surface data-canvas-live="1" style="width:800px;height:600px;overflow:auto">
        <div data-canvas-scroll-content><div class="canvas-world"></div></div>
        <div data-canvas-placed="frame-1" style="position:absolute;left:0;top:0"></div>
      </div>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });
    Object.defineProperty(surface, "clientWidth", { value: 800, configurable: true });
    Object.defineProperty(surface, "clientHeight", { value: 600, configurable: true });

    useDocument.setState({
      frames: { "frame-1": { id: "frame-1", title: "sprint", createdAt: new Date().toISOString() } },
      framePlacements: { "frame-1": { x: 2000, y: 1500, width: 600, height: 400 } },
      canvasViewport: { scrollLeft: 0, scrollTop: 0, zoom: 1 },
    });

    const unbind = bindCanvasReveal(surface);
    window.dispatchEvent(new CustomEvent("vira:reveal-card", { detail: { id: "frame-1", smooth: false } }));

    expect(useDocument.getState().canvasViewport.scrollLeft).toBeGreaterThan(1000);
    expect(useDocument.getState().canvasViewport.scrollTop).toBeGreaterThan(800);
    unbind();
  });
});
