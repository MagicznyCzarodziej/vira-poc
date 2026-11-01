// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { FRAME_MIN_HEIGHT, FRAME_MIN_WIDTH } from "../../domain/index.ts";
import { useDocument } from "../../store/useDocument.ts";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";

describe("bindCanvasGestures frame tool", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("creates a frame when dragging on the canvas with the frame tool", () => {
    document.body.innerHTML = `
      <div class="canvas-surface-shell">
        <div data-canvas-surface style="width:800px;height:600px;position:relative">
          <div data-canvas-scroll-content>
            <div class="canvas-world"></div>
          </div>
        </div>
      </div>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });

    useDocument.getState().setCanvasTool("frame");
    const unbind = bindCanvasGestures(surface, { current: null });

    surface.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 100, clientY: 100, pointerId: 3, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 100 + FRAME_MIN_WIDTH + 20, clientY: 100 + FRAME_MIN_HEIGHT + 20, pointerId: 3, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 100 + FRAME_MIN_WIDTH + 20, clientY: 100 + FRAME_MIN_HEIGHT + 20, pointerId: 3, button: 0 }),
    );

    expect(Object.keys(useDocument.getState().frames)).toHaveLength(1);
    const id = Object.keys(useDocument.getState().frames)[0]!;
    const placement = useDocument.getState().framePlacements[id]!;
    expect(placement.width).toBeGreaterThanOrEqual(FRAME_MIN_WIDTH);
    expect(placement.height).toBeGreaterThanOrEqual(FRAME_MIN_HEIGHT);
    expect(useDocument.getState().canvasTool).toBe("default");

    unbind();
  });

  it("exits the frame tool on Escape", () => {
    document.body.innerHTML = `<div data-canvas-surface style="width:400px;height:300px"></div>`;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    useDocument.getState().setCanvasTool("frame");
    const unbind = bindCanvasGestures(surface, { current: null });

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(useDocument.getState().canvasTool).toBe("default");

    unbind();
  });
});
