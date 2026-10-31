// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { bindListDragBlocked } from "./bindListDragBlocked.ts";
import { listCanvasRowId } from "./listCanvasListRow.ts";

describe("listCanvasRowId", () => {
  it("reads card and action ids", () => {
    const card = document.createElement("article");
    card.dataset.id = "item-1";
    expect(listCanvasRowId(card)).toBe("item-1");

    const ap = document.createElement("article");
    ap.dataset.actionPointId = "ap-2";
    expect(listCanvasRowId(ap)).toBe("ap-2");
  });
});

describe("bindListDragBlocked", () => {
  it("reveals an action point on canvas when dragging a blocked list row", () => {
    document.body.innerHTML = `
      <div id="root">
        <div class="workspace-list">
          <div class="list-action-points">
            <article class="action-point-card canvas-list-drag-blocked" data-id="ap-1" data-action-point-id="ap-1">
              <div class="action-point-title">Ship</div>
            </article>
          </div>
        </div>
      </div>
    `;
    const root = document.getElementById("root")!;
    const reveal = vi.fn();
    window.addEventListener("vira:reveal-card", reveal);
    const unbind = bindListDragBlocked(root);
    const row = document.querySelector(".action-point-card")!;

    row.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 0, clientY: 0, pointerId: 1, button: 0 }));
    root.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 12, clientY: 0, pointerId: 1, button: 0 }));

    expect(row.classList.contains("is-list-drag-blocked")).toBe(true);
    expect(reveal).toHaveBeenCalled();
    expect((reveal.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ id: "ap-1", smooth: false });

    root.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 12, clientY: 0, pointerId: 1, button: 0 }));
    expect(row.classList.contains("is-list-drag-blocked")).toBe(false);

    window.removeEventListener("vira:reveal-card", reveal);
    unbind();
  });
});
