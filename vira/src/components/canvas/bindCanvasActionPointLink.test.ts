// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";
import { useDocument } from "../../store/useDocument.ts";

describe("bindCanvasGestures action point link drag", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.classList.remove("ap-link-drag-active");
  });

  it("shift-drags a placed action onto a decision without moving placement", () => {
    useDocument.getState().submitComposer("Done", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Task");
    useDocument.getState().cancelEdit();
    useDocument.getState().placeActionPointAtWorld(apId, 100, 100);
    const placementBefore = { ...useDocument.getState().actionPointPlacements[apId]! };

    document.body.innerHTML = `
      <div class="canvas-surface-shell">
        <div data-canvas-surface data-canvas-live style="width:600px;height:400px">
          <div data-canvas-scroll-content style="width:600px;height:400px">
            <div class="canvas-world">
              <div class="canvas-placed-action-point" data-canvas-placed="${apId}">
                <article class="action-point-card">
                  <div class="action-point-title">Task</div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
      <article class="card" data-id="${itemId}">
        <div class="answer-block answered" data-step="0" data-id="${itemId}">
          <span class="answer-text">Done</span>
        </div>
      </article>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 600, height: 400, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });
    const answer = document.querySelector(".answer-block")!;
    document.elementFromPoint = () => answer;

    const spawnGesture = { current: null };
    const unbind = bindCanvasGestures(surface, spawnGesture);
    const title = document.querySelector(".action-point-title")!;

    title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10, pointerId: 7, button: 0, shiftKey: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 30, clientY: 10, pointerId: 7, button: 0 }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 50, clientY: 20, pointerId: 7, button: 0 }));

    expect(useDocument.getState().items[itemId]!.steps[0]!.actionPointRefs).toEqual([apId]);
    expect(useDocument.getState().actionPointPlacements[apId]).toEqual(placementBefore);
    unbind();
  });

  it("reverts placement and links when shift is pressed mid canvas drag", () => {
    useDocument.getState().submitComposer("Done", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Task");
    useDocument.getState().cancelEdit();
    useDocument.getState().placeActionPointAtWorld(apId, 100, 100);
    const placementBefore = { ...useDocument.getState().actionPointPlacements[apId]! };

    document.body.innerHTML = `
      <div class="canvas-surface-shell">
        <div data-canvas-surface data-canvas-live style="width:600px;height:400px">
          <div data-canvas-scroll-content style="width:600px;height:400px">
            <div class="canvas-world">
              <div class="canvas-placed-action-point" data-canvas-placed="${apId}">
                <article class="action-point-card">
                  <div class="action-point-title">Task</div>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
      <article class="card" data-id="${itemId}">
        <div class="answer-block answered" data-step="0" data-id="${itemId}">
          <span class="answer-text">Done</span>
        </div>
      </article>
    `;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 600, height: 400, right: 600, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });
    const answer = document.querySelector(".answer-block")!;
    document.elementFromPoint = () => answer;

    const spawnGesture = { current: null };
    const unbind = bindCanvasGestures(surface, spawnGesture);
    const title = document.querySelector(".action-point-title")!;

    title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10, pointerId: 8, button: 0 }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 50, clientY: 50, pointerId: 8, button: 0 }));
    expect(useDocument.getState().actionPointPlacements[apId]!.x).not.toBe(placementBefore.x);

    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 60, clientY: 55, pointerId: 8, button: 0, shiftKey: true }));
    expect(useDocument.getState().actionPointPlacements[apId]).toEqual(placementBefore);
    expect(document.querySelector(".action-point-link-drag-ghost")).toBeTruthy();

    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 60, clientY: 55, pointerId: 8, button: 0, shiftKey: true }));
    expect(useDocument.getState().items[itemId]!.steps[0]!.actionPointRefs).toEqual([apId]);
    unbind();
  });
});
