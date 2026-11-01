// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDocument } from "../../store/useDocument.ts";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";

function mountOneCard() {
  useDocument.getState().submitComposer("Drag me", "question");
  const itemId = Object.keys(useDocument.getState().items)[0]!;
  useDocument.getState().cancelEdit();
  useDocument.getState().placeNewCardAtWorld(itemId, 40, 40);
  const key = Object.keys(useDocument.getState().canvasPlacements)[0]!;
  const startY = useDocument.getState().canvasPlacements[key]!.y;

  document.body.innerHTML = `
    <div data-canvas-surface style="width:600px;height:400px;overflow:auto">
      <div data-canvas-scroll-content>
        <div class="canvas-world">
          <div class="canvas-placed-card" data-canvas-placed="${key}" data-canvas-item-id="${itemId}">
            <article class="card" data-id="${itemId}">
              <div class="problem editable" data-editable="problem" data-id="${itemId}" data-step="0">Drag me</div>
            </article>
          </div>
        </div>
      </div>
    </div>
  `;
  const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
  surface.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 600, height: 400, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return { key, startY, surface };
}

describe("bindCanvasGestures drag defer", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("does not update store placement until pointerup", () => {
    const { key, startY, surface } = mountOneCard();
    const moveSpy = vi.spyOn(useDocument.getState(), "movePlacements");
    const unbind = bindCanvasGestures(surface, { current: null });
    const host = document.querySelector(".canvas-placed-card") as HTMLElement;

    host.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 50, clientY: 50, pointerId: 1, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 50, clientY: 120, pointerId: 1, button: 0 }),
    );

    expect(useDocument.getState().canvasPlacements[key]!.y).toBe(startY);
    expect(moveSpy).not.toHaveBeenCalled();
    expect(host.style.transform).toContain("translate");

    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 50, clientY: 120, pointerId: 1, button: 0 }),
    );

    expect(useDocument.getState().canvasPlacements[key]!.y).toBeGreaterThan(startY);
    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(host.style.transform).toBe("");
    moveSpy.mockRestore();
    unbind();
  });
});
