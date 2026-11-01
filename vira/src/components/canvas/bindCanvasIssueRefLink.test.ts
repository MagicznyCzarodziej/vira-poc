// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";
import { useDocument } from "../../store/useDocument.ts";

describe("bindCanvasGestures issue ref link drag", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.classList.remove("issue-ref-link-drag-active");
  });

  it("shift-drags from a decision onto another card field", () => {
    useDocument.getState().submitComposer("Source", "decision");
    const sourceItemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().submitComposer("Target Q?", "question");
    const targetItemId = Object.keys(useDocument.getState().items).find((id) => id !== sourceItemId)!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(sourceItemId, 50, 50);
    useDocument.getState().placeNewCardAtWorld(targetItemId, 300, 50);

    const sourceKey = Object.keys(useDocument.getState().canvasPlacements).find(
      (k) => useDocument.getState().canvasPlacements[k]?.itemId === sourceItemId || k === sourceItemId,
    ) ?? sourceItemId;

    document.body.innerHTML = `
      <div class="canvas-surface-shell">
        <div data-canvas-surface data-canvas-live style="width:800px;height:600px">
          <div data-canvas-scroll-content style="width:800px;height:600px">
            <div class="canvas-world">
              <div class="canvas-placed-card" data-canvas-placed="${sourceKey}" data-canvas-item-id="${sourceItemId}">
                <article class="card" data-id="${sourceItemId}">
                  <div class="answer-block" data-ref-pick="answer" data-id="${sourceItemId}" data-step="0">Source</div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
      <article class="card" data-id="${targetItemId}">
        <div class="problem editable" data-ref-pick="problem" data-id="${targetItemId}" data-step="0">Target Q?</div>
      </article>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => ({}) });
    const targetProblem = document.querySelector<HTMLElement>(".problem")!;
    document.elementFromPoint = () => targetProblem;

    const spawnGesture = { current: null };
    const unbind = bindCanvasGestures(surface, spawnGesture);
    const sourceAnswer = document.querySelector<HTMLElement>("[data-ref-pick='answer']")!;

    sourceAnswer.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 60, clientY: 60, pointerId: 3, button: 0, shiftKey: true }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { bubbles: true, clientX: 120, clientY: 80, pointerId: 3, button: 0, shiftKey: true }),
    );
    window.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, clientX: 120, clientY: 80, pointerId: 3, button: 0, shiftKey: true }),
    );

    expect(useDocument.getState().items[targetItemId]!.steps[0]!.problem).toMatch(/!\d+/);
    unbind();
  });
});
