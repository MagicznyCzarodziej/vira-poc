// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { CARD_WIDTH, DROP_OFFSET_Y } from "../../domain/index.ts";
import {
  bindListCardPointerDrag,
  finishListCardPointerDrag,
  shouldStartListCardPointerDrag,
  type ListCardPointerDragDeps,
  type ListCardPointerDragSession,
} from "./listCardPointerDrag.ts";

function sessionAt(x: number, y: number): ListCardPointerDragSession {
  const card = document.createElement("article");
  return {
    id: "item-1",
    card,
    pointerId: 1,
    startX: x,
    startY: y,
    dragging: false,
  };
}

describe("shouldStartListCardPointerDrag", () => {
  it("requires moving past the drag threshold", () => {
    const s = sessionAt(100, 100);
    expect(shouldStartListCardPointerDrag(s, 103, 100)).toBe(false);
    expect(shouldStartListCardPointerDrag(s, 106, 100)).toBe(true);
  });
});

describe("bindListCardPointerDrag", () => {
  it("places the card on canvas after dragging from the id button", () => {
    document.body.innerHTML = `
      <div id="root">
        <article data-canvas-drag-id="item-1" class="card">
          <button type="button" class="card-id">!1</button>
        </article>
        <div data-canvas-surface style="width:400px;height:300px"></div>
      </div>
    `;
    const root = document.getElementById("root")!;
    const surface = document.querySelector<HTMLElement>("[data-canvas-surface]")!;
    const placeAtWorld = vi.fn();
    const deps: ListCardPointerDragDeps = {
      placeAtWorld,
      findCanvasSurface: () => surface,
      canvasWorldPoint: () => ({ x: 120, y: 80 }),
    };
    const unbind = bindListCardPointerDrag(root, deps);
    const button = document.querySelector<HTMLButtonElement>(".card-id")!;

    button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 10, clientY: 10, pointerId: 1, button: 0 }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 30, clientY: 10, pointerId: 1, button: 0 }));
    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 200, clientY: 150, pointerId: 1, button: 0 }));

    expect(placeAtWorld).toHaveBeenCalledWith("item-1", 120 - CARD_WIDTH / 2, 80 - DROP_OFFSET_Y);
    unbind();
  });

  it("does not place when the pointer is released without dragging", () => {
    document.body.innerHTML = `
      <div id="root">
        <article data-canvas-drag-id="item-2" class="card">
          <button type="button" class="btn-delete">×</button>
        </article>
      </div>
    `;
    const root = document.getElementById("root")!;
    const placeAtWorld = vi.fn();
    const unbind = bindListCardPointerDrag(root, {
      placeAtWorld,
      findCanvasSurface: () => null,
      canvasWorldPoint: () => ({ x: 0, y: 0 }),
    });
    const button = document.querySelector("button")!;

    button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0, clientY: 0, pointerId: 2, button: 0 }));
    button.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 1, clientY: 1, pointerId: 2, button: 0 }));

    expect(placeAtWorld).not.toHaveBeenCalled();
    unbind();
  });
});

describe("finishListCardPointerDrag", () => {
  it("returns false when the session never entered drag mode", () => {
    const placeAtWorld = vi.fn();
    const ok = finishListCardPointerDrag(
      { ...sessionAt(0, 0), dragging: false },
      50,
      50,
      { placeAtWorld, findCanvasSurface: () => document.createElement("div"), canvasWorldPoint: () => ({ x: 0, y: 0 }) },
    );
    expect(ok).toBe(false);
    expect(placeAtWorld).not.toHaveBeenCalled();
  });
});
