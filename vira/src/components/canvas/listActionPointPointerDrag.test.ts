// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACTION_DROP_OFFSET_Y, ACTION_POINT_WIDTH } from "../../domain/index.ts";
import { useDocument } from "../../store/useDocument.ts";
import {
  bindListActionPointPointerDrag,
  finishListActionPointPointerDrag,
  type ListActionPointPointerDragDeps,
  type ListActionPointPointerDragSession,
} from "./listActionPointPointerDrag.ts";
import { clearActionPointLinkDragGhost } from "./actionPointLinkDragGhost.ts";
import { clearListActionPointDragGhost } from "./listActionPointPointerDragGhost.ts";

function sessionAt(x: number, y: number): ListActionPointPointerDragSession {
  const el = document.createElement("article");
  return {
    id: "ap-1",
    el,
    card: el,
    pointerId: 1,
    startX: x,
    startY: y,
    dragging: false,
    mode: "place",
  };
}

describe("bindListActionPointPointerDrag", () => {
  afterEach(() => {
    clearListActionPointDragGhost();
    clearActionPointLinkDragGhost();
    document.body.classList.remove("list-action-point-pointer-drag-active");
    document.body.innerHTML = "";
  });

  it("shows a drag ghost while moving and places on canvas drop", () => {
    document.body.innerHTML = `
      <div id="root">
        <article data-canvas-drag-ap-id="ap-1" class="action-point-card">
          <span class="action-point-id">ap-1</span>
          <div class="action-point-title">Deploy</div>
        </article>
        <div data-canvas-surface style="width:400px;height:300px"></div>
      </div>
    `;
    const root = document.getElementById("root")!;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    const placeActionPointAtWorld = vi.fn();
    const deps: ListActionPointPointerDragDeps = {
      placeActionPointAtWorld,
      findCanvasSurface: () => surface,
      canvasWorldPoint: () => ({ x: 120, y: 80 }),
    };
    const unbind = bindListActionPointPointerDrag(root, deps);
    const title = document.querySelector(".action-point-title")!;

    title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10, pointerId: 1, button: 0 }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 30, clientY: 10, pointerId: 1, button: 0 }));

    expect(document.querySelector(".list-action-point-pointer-drag-ghost")).toBeTruthy();
    expect(document.body.classList.contains("list-action-point-pointer-drag-active")).toBe(true);

    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 200, clientY: 150, pointerId: 1, button: 0 }));

    expect(placeActionPointAtWorld).toHaveBeenCalledWith(
      "ap-1",
      120 - ACTION_POINT_WIDTH / 2,
      80 - ACTION_DROP_OFFSET_Y,
    );
    expect(document.querySelector(".list-action-point-pointer-drag-ghost")).toBeNull();
    unbind();
  });

  it("does not place when released without dragging", () => {
    document.body.innerHTML = `
      <div id="root">
        <article data-canvas-drag-ap-id="ap-2" class="action-point-card">
          <div class="action-point-title">Review</div>
        </article>
      </div>
    `;
    const root = document.getElementById("root")!;
    const placeActionPointAtWorld = vi.fn();
    const unbind = bindListActionPointPointerDrag(root, {
      placeActionPointAtWorld,
      findCanvasSurface: () => null,
      canvasWorldPoint: () => ({ x: 0, y: 0 }),
    });
    const title = document.querySelector(".action-point-title")!;

    title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0, clientY: 0, pointerId: 2, button: 0 }));
    title.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 1, clientY: 1, pointerId: 2, button: 0 }));

    expect(placeActionPointAtWorld).not.toHaveBeenCalled();
    expect(document.querySelector(".list-action-point-pointer-drag-ghost")).toBeNull();
    unbind();
  });

  it("activates link-drag styling when shift-dragging", () => {
    document.body.innerHTML = `
      <div id="root">
        <article data-canvas-drag-ap-id="ap-5" class="action-point-card">
          <div class="action-point-title">Link me</div>
        </article>
      </div>
    `;
    const root = document.getElementById("root")!;
    const unbind = bindListActionPointPointerDrag(root, {
      placeActionPointAtWorld: vi.fn(),
      findCanvasSurface: () => null,
      canvasWorldPoint: () => ({ x: 0, y: 0 }),
    });
    document.elementFromPoint = () => null;
    const title = document.querySelector(".action-point-title")!;

    title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0, clientY: 0, pointerId: 5, button: 0, shiftKey: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 20, clientY: 0, pointerId: 5, button: 0, shiftKey: true }));

    expect(document.body.classList.contains("ap-link-drag-active")).toBe(true);
    expect(document.querySelector(".action-point-link-drag-ghost")).toBeTruthy();
    expect(document.querySelector(".list-action-point-pointer-drag-ghost")).toBeNull();

    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 20, clientY: 0, pointerId: 5, button: 0, shiftKey: true }));
    expect(document.body.classList.contains("ap-link-drag-active")).toBe(false);
    unbind();
  });

  it("does not place on canvas when shift-dragging", () => {
    document.body.innerHTML = `
      <div id="root">
        <article data-canvas-drag-ap-id="ap-4" class="action-point-card">
          <div class="action-point-title">Link me</div>
        </article>
        <div data-canvas-surface style="width:400px;height:300px"></div>
      </div>
    `;
    const root = document.getElementById("root")!;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    const placeActionPointAtWorld = vi.fn();
    const unbind = bindListActionPointPointerDrag(root, {
      placeActionPointAtWorld,
      findCanvasSurface: () => surface,
      canvasWorldPoint: () => ({ x: 0, y: 0 }),
    });
    const title = document.querySelector(".action-point-title")!;
    document.elementFromPoint = () => null;

    title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0, clientY: 0, pointerId: 4, button: 0, shiftKey: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 20, clientY: 0, pointerId: 4, button: 0, shiftKey: true }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 200, clientY: 150, pointerId: 4, button: 0, shiftKey: true }));

    expect(placeActionPointAtWorld).not.toHaveBeenCalled();
    expect(document.querySelector(".list-action-point-pointer-drag-ghost")).toBeNull();
    expect(document.body.classList.contains("ap-link-drag-active")).toBe(false);
    unbind();
  });

  it("ignores pointer down on checkbox controls", () => {
    document.body.innerHTML = `
      <div id="root">
        <article data-canvas-drag-ap-id="ap-3" class="action-point-card">
          <label class="action-point-done"><input type="checkbox" /></label>
        </article>
      </div>
    `;
    const root = document.getElementById("root")!;
    const placeActionPointAtWorld = vi.fn();
    const unbind = bindListActionPointPointerDrag(root, {
      placeActionPointAtWorld,
      findCanvasSurface: () => null,
      canvasWorldPoint: () => ({ x: 0, y: 0 }),
    });
    const checkbox = document.querySelector("input")!;

    checkbox.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0, clientY: 0, pointerId: 3, button: 0 }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 20, clientY: 0, pointerId: 3, button: 0 }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 20, clientY: 0, pointerId: 3, button: 0 }));

    expect(placeActionPointAtWorld).not.toHaveBeenCalled();
    unbind();
  });
});

describe("shift-drag link integration", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  afterEach(() => {
    document.body.classList.remove("ap-link-drag-active");
    document.body.innerHTML = "";
  });

  it("links an action to a decision answer on shift-drag release", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().cancelEdit();

    document.body.innerHTML = `
      <div id="root">
        <article data-canvas-drag-ap-id="${apId}" class="action-point-card">
          <div class="action-point-title">Deploy</div>
        </article>
        <article class="card" data-id="${itemId}">
          <div class="answer-block answered" data-step="0" data-id="${itemId}">
            <span class="answer-text">Ship REST</span>
          </div>
        </article>
      </div>
    `;
    const answer = document.querySelector(".answer-block")!;
    document.elementFromPoint = () => answer;

    const unbind = bindListActionPointPointerDrag(document.getElementById("root")!, {
      placeActionPointAtWorld: vi.fn(),
      findCanvasSurface: () => null,
      canvasWorldPoint: () => ({ x: 0, y: 0 }),
    });
    const title = document.querySelector(".action-point-title")!;

    title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0, clientY: 0, pointerId: 9, button: 0, shiftKey: true }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 24, clientY: 0, pointerId: 9, button: 0, shiftKey: true }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 40, clientY: 12, pointerId: 9, button: 0, shiftKey: true }));

    expect(useDocument.getState().items[itemId]!.steps[0]!.actionPointRefs).toEqual([apId]);
    unbind();
  });
});

describe("finishListActionPointPointerDrag", () => {
  it("returns false when the session never entered drag mode", () => {
    const placeActionPointAtWorld = vi.fn();
    const ok = finishListActionPointPointerDrag(
      { ...sessionAt(0, 0), dragging: false },
      50,
      50,
      {
        placeActionPointAtWorld,
        findCanvasSurface: () => document.createElement("div"),
        canvasWorldPoint: () => ({ x: 0, y: 0 }),
      },
    );
    expect(ok).toBe(false);
    expect(placeActionPointAtWorld).not.toHaveBeenCalled();
  });
});
