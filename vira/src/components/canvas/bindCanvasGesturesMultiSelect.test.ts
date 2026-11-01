// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../store/useDocument.ts";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";

function mountTwoCards() {
  useDocument.getState().submitComposer("First?", "question");
  const itemA = Object.keys(useDocument.getState().items)[0]!;
  useDocument.getState().cancelEdit();
  useDocument.getState().submitComposer("Second", "decision");
  const itemB = Object.keys(useDocument.getState().items).find((id) => id !== itemA)!;
  useDocument.getState().cancelEdit();
  useDocument.getState().placeNewCardAtWorld(itemA, 40, 40);
  useDocument.getState().placeNewCardAtWorld(itemB, 240, 40);
  const keys = Object.keys(useDocument.getState().canvasPlacements);
  const keyA = keys.find((k) => useDocument.getState().canvasPlacements[k]?.itemId === itemA)!;
  const keyB = keys.find((k) => useDocument.getState().canvasPlacements[k]?.itemId === itemB)!;

  document.body.innerHTML = `
    <div class="canvas-surface-shell">
      <div data-canvas-surface style="width:600px;height:400px">
        <div data-canvas-scroll-content>
          <div class="canvas-world">
            <div class="canvas-placed-card" data-canvas-placed="${keyA}" data-canvas-item-id="${itemA}">
              <article class="card" data-id="${itemA}">
                <div class="problem editable" data-editable="problem" data-id="${itemA}" data-step="0">First?</div>
              </article>
            </div>
            <div class="canvas-placed-card" data-canvas-placed="${keyB}" data-canvas-item-id="${itemB}">
              <article class="card" data-id="${itemB}">
                <div class="answer editable" data-editable="answer" data-id="${itemB}" data-step="0">Second</div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
  surface.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 600, height: 400, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return { keyA, keyB, itemA, itemB, surface };
}

describe("bindCanvasGestures shift multi-select", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("shift-clicks on editable fields toggle selection without opening edit", () => {
    const { keyA, keyB, surface } = mountTwoCards();
    useDocument.getState().setCanvasSelection([keyA]);

    const unbind = bindCanvasGestures(surface, { current: null });
    const answer = document.querySelector(".answer")!;

    answer.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 260, clientY: 20, pointerId: 1, button: 0, shiftKey: true }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 260, clientY: 20, pointerId: 1, button: 0, shiftKey: true }),
    );

    expect(useDocument.getState().canvasSelection.sort()).toEqual([keyA, keyB].sort());
    expect(useDocument.getState().editing).toBeNull();
    unbind();
  });

  it("shift-clicks again to remove an item from the selection", () => {
    const { keyA, keyB, surface } = mountTwoCards();
    useDocument.getState().setCanvasSelection([keyA, keyB]);

    const unbind = bindCanvasGestures(surface, { current: null });
    const problem = document.querySelector(".problem")!;

    problem.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20, pointerId: 2, button: 0, shiftKey: true }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 20, clientY: 20, pointerId: 2, button: 0, shiftKey: true }),
    );

    expect(useDocument.getState().canvasSelection).toEqual([keyB]);
    unbind();
  });
});
