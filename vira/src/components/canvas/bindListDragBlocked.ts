import { LIST_CANVAS_DRAG_BLOCKED_SELECTOR, listCanvasRowId } from "./listCanvasListRow.ts";

/** List rows already on canvas: drag attempt shakes the row and centers the canvas copy. */
export function bindListDragBlocked(root: HTMLElement): () => void {
  let state: {
    pointerId: number;
    startX: number;
    startY: number;
    row: HTMLElement;
    dragging: boolean;
  } | null = null;

  const end = (event: PointerEvent) => {
    if (!state || event.pointerId !== state.pointerId) return;
    state.row.classList.remove("is-list-drag-blocked");
    state = null;
    document.body.classList.remove("canvas-list-drag-blocked-active");
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const row = (event.target as Element).closest(LIST_CANVAS_DRAG_BLOCKED_SELECTOR);
    if (!(row instanceof HTMLElement)) return;
    state = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      row,
      dragging: false,
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!state || event.pointerId !== state.pointerId || state.dragging) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (dx * dx + dy * dy <= 9) return;
    state.dragging = true;
    state.row.classList.add("is-list-drag-blocked");
    document.body.classList.add("canvas-list-drag-blocked-active");
    const itemId = listCanvasRowId(state.row);
    if (itemId) {
      window.dispatchEvent(
        new CustomEvent("vira:reveal-card", { detail: { id: itemId, smooth: false } }),
      );
    }
    event.preventDefault();
  };

  const onSelectStart = (event: Event) => {
    if ((event.target as Element).closest(`${LIST_CANVAS_DRAG_BLOCKED_SELECTOR}.is-list-drag-blocked`)) {
      event.preventDefault();
    }
  };

  root.addEventListener("pointerdown", onPointerDown, true);
  root.addEventListener("pointermove", onPointerMove, true);
  root.addEventListener("pointerup", end, true);
  root.addEventListener("pointercancel", end, true);
  root.addEventListener("selectstart", onSelectStart);
  return () => {
    root.removeEventListener("pointerdown", onPointerDown, true);
    root.removeEventListener("pointermove", onPointerMove, true);
    root.removeEventListener("pointerup", end, true);
    root.removeEventListener("pointercancel", end, true);
    root.removeEventListener("selectstart", onSelectStart);
    document.body.classList.remove("canvas-list-drag-blocked-active");
  };
}
