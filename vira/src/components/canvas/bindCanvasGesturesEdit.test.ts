// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/useDocument.ts";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";

describe("bindCanvasGestures canvas card editing", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("opens canvas edit on tap in a data-editable field", () => {
    useDocument.getState().submitComposer("Should we ship?", "question");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 80, 80);
    const placementKey = Object.keys(useDocument.getState().canvasPlacements)[0]!;

    document.body.innerHTML = `
      <div class="canvas-surface-shell">
        <div data-canvas-surface style="width:600px;height:400px">
          <div data-canvas-scroll-content>
            <div class="canvas-world">
              <div class="canvas-placed-card" data-canvas-placed="${placementKey}" data-canvas-item-id="${itemId}">
                <article class="card" data-id="${itemId}">
                  <div class="problem editable" data-editable="problem" data-id="${itemId}" data-step="0">Should we ship?</div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 600, height: 400, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });

    const unbind = bindCanvasGestures(surface, { current: null });
    const problem = document.querySelector(".problem")!;

    problem.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 3, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 20, clientY: 20, pointerId: 3, button: 0 }),
    );

    expect(useDocument.getState().editing).toMatchObject({
      id: itemId,
      field: "problem",
      step: 0,
      surface: "canvas",
      canvasPlacementKey: placementKey,
    });
    const nonceAfterTap = useDocument.getState().focusNonce;
    problem.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 20, clientY: 20 }));
    expect(useDocument.getState().focusNonce).toBe(nonceAfterTap);
    expect(useDocument.getState().editing?.field).toBe("problem");
    unbind();
  });

  it("arms drag from a data-editable field when the pointer moves past the threshold", () => {
    useDocument.getState().submitComposer("Should we ship?", "question");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 80, 80);
    const placementKey = Object.keys(useDocument.getState().canvasPlacements)[0]!;

    document.body.innerHTML = `
      <div class="canvas-surface-shell">
        <div data-canvas-surface style="width:600px;height:400px">
          <div data-canvas-scroll-content>
            <div class="canvas-world">
              <div class="canvas-placed-card" data-canvas-placed="${placementKey}" data-canvas-item-id="${itemId}">
                <article class="card" data-id="${itemId}">
                  <div class="problem editable" data-editable="problem" data-id="${itemId}" data-step="0">Should we ship?</div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 600, height: 400, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });

    const unbind = bindCanvasGestures(surface, { current: null });
    const problem = document.querySelector(".problem")!;

    problem.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 3, button: 0 }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 40, clientY: 20, pointerId: 3, button: 0 }),
    );
    const before = { ...useDocument.getState().canvasPlacements[placementKey]! };
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 80, clientY: 20, pointerId: 3, button: 0 }),
    );
    expect(useDocument.getState().canvasPlacements[placementKey]!.x).toBe(before.x);
    expect(document.querySelector<HTMLElement>(`[data-canvas-placed="${placementKey}"]`)!.style.transform).toContain("translate");
    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 80, clientY: 20, pointerId: 3, button: 0 }),
    );
    expect(useDocument.getState().canvasPlacements[placementKey]!.x).not.toBe(before.x);
    unbind();
  });

  it("selects the placement when pointerdown hits non-editable chrome", () => {
    useDocument.getState().submitComposer("Ship it", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 80, 80);
    const placementKey = Object.keys(useDocument.getState().canvasPlacements)[0]!;

    document.body.innerHTML = `
      <div class="canvas-surface-shell">
        <div data-canvas-surface style="width:600px;height:400px">
          <div data-canvas-scroll-content>
            <div class="canvas-world">
              <div class="canvas-placed-card" data-canvas-placed="${placementKey}" data-canvas-item-id="${itemId}">
                <article class="card" data-id="${itemId}">
                  <span class="card-id">1</span>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 600, height: 400, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });

    const unbind = bindCanvasGestures(surface, { current: null });
    const cardId = document.querySelector(".card-id")!;

    cardId.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 4, button: 0 }),
    );

    expect(useDocument.getState().canvasSelection).toEqual([placementKey]);
    unbind();
  });
});
