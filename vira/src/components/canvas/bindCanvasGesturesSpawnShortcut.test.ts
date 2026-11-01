// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/useDocument.ts";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";

function mountCanvasSurface(): HTMLElement {
  document.body.innerHTML = `
    <div data-canvas-surface style="width:800px;height:600px;position:relative"></div>
  `;
  const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
  surface.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });
  return surface;
}

describe("bindCanvasGestures spawn shortcuts", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
    useDocument.getState().setView("list");
  });

  it("places a question at the pointer with Q", () => {
    const surface = mountCanvasSurface();
    const unbind = bindCanvasGestures(surface, { current: null });
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 400, clientY: 300, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "q", bubbles: true }));

    expect(useDocument.getState().editing?.field).toBe("problem");
    expect(Object.keys(useDocument.getState().canvasPlacements)).toHaveLength(1);
    unbind();
  });

  it("places a decision at the pointer with D", () => {
    const surface = mountCanvasSurface();
    const unbind = bindCanvasGestures(surface, { current: null });
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 400, clientY: 300, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }));

    expect(useDocument.getState().editing?.field).toBe("answer");
    expect(Object.keys(useDocument.getState().canvasPlacements)).toHaveLength(1);
    unbind();
  });

  it("places a sticky note at the pointer with N", () => {
    const surface = mountCanvasSurface();
    const unbind = bindCanvasGestures(surface, { current: null });
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 400, clientY: 300, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "n", bubbles: true }));

    expect(useDocument.getState().editing?.field).toBe("noteBody");
    expect(Object.keys(useDocument.getState().notePlacements)).toHaveLength(1);
    unbind();
  });

  it("does not spawn when the pointer is outside the canvas", () => {
    const surface = mountCanvasSurface();
    const unbind = bindCanvasGestures(surface, { current: null });
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 900, clientY: 300, bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "d", bubbles: true }));

    expect(Object.keys(useDocument.getState().items)).toHaveLength(0);
    unbind();
  });
});
