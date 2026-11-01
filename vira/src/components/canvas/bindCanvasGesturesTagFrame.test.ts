// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/useDocument.ts";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";

describe("bindCanvasGestures tag frame placement", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("creates a framed tag batch at the clicked canvas point", () => {
    const id = useDocument.getState().createBlankCard("list", "decision");
    useDocument.getState().addTag(id!, "sprint");
    useDocument.getState().setTagFramePlacementTag("sprint");

    document.body.innerHTML = `
      <div data-canvas-surface style="width:800px;height:600px;position:relative"></div>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });

    const unbind = bindCanvasGestures(surface, { current: null });
    surface.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 400, clientY: 300, pointerId: 2, button: 0 }),
    );

    expect(useDocument.getState().tagFramePlacementTag).toBeNull();
    expect(Object.keys(useDocument.getState().frames)).toHaveLength(1);
    expect(Object.keys(useDocument.getState().canvasPlacements)).toHaveLength(1);
    unbind();
  });
});
