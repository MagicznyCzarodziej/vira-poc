// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bindListActionPointPointerDrag,
  enterListActionPointLinkMode,
  type ListActionPointPointerDragSession,
} from "./listActionPointPointerDrag.ts";
import { clearActionPointLinkDragGhost } from "./actionPointLinkDragGhost.ts";
import {
  clearListActionPointDragGhost,
  syncListActionPointDragGhost,
} from "./listActionPointPointerDragGhost.ts";

describe("enterListActionPointLinkMode", () => {
  afterEach(() => {
    clearListActionPointDragGhost();
    clearActionPointLinkDragGhost();
    document.body.classList.remove("ap-link-drag-active", "list-action-point-pointer-drag-active");
  });

  it("replaces the canvas placement ghost with the link chip", () => {
    document.body.innerHTML = `<article class="action-point-card"><div class="action-point-title">Task</div></article>`;
    const el = document.querySelector("article")!;
    const session: ListActionPointPointerDragSession = {
      id: "ap-1",
      el,
      card: el,
      pointerId: 1,
      startX: 0,
      startY: 0,
      dragging: true,
      mode: "place",
    };
    document.body.classList.add("list-action-point-pointer-drag-active");
    syncListActionPointDragGhost(el, 50, 50);

    enterListActionPointLinkMode(session, 100, 80);

    expect(session.mode).toBe("link");
    expect(document.body.classList.contains("list-action-point-pointer-drag-active")).toBe(false);
    expect(document.querySelector(".list-action-point-pointer-drag-ghost")).toBeNull();
    expect(document.querySelector(".action-point-link-drag-ghost")).toBeTruthy();
    expect(document.body.classList.contains("ap-link-drag-active")).toBe(true);
  });
});

describe("bindListActionPointPointerDrag shift mid-drag", () => {
  afterEach(() => {
    clearListActionPointDragGhost();
    clearActionPointLinkDragGhost();
    document.body.innerHTML = "";
  });

  it("switches to link mode when shift is pressed during a placement drag", () => {
    document.body.innerHTML = `
      <div id="root">
        <article data-canvas-drag-ap-id="ap-1" class="action-point-card">
          <div class="action-point-title">Deploy</div>
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
    document.elementFromPoint = () => null;

    title.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0, clientY: 0, pointerId: 1, button: 0 }));
    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 30, clientY: 0, pointerId: 1, button: 0 }));
    expect(document.querySelector(".list-action-point-pointer-drag-ghost")).toBeTruthy();

    window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 40, clientY: 0, pointerId: 1, button: 0, shiftKey: true }));
    expect(document.querySelector(".list-action-point-pointer-drag-ghost")).toBeNull();
    expect(document.querySelector(".action-point-link-drag-ghost")).toBeTruthy();

    window.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 40, clientY: 0, pointerId: 1, button: 0, shiftKey: true }));
    expect(placeActionPointAtWorld).not.toHaveBeenCalled();
    unbind();
  });
});
