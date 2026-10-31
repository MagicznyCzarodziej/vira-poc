/** List cards already on canvas: drag attempt shakes the row and centers the canvas copy. */
export function bindListDragBlocked(root: HTMLElement): () => void {
  let state: {
    pointerId: number;
    startX: number;
    startY: number;
    card: HTMLElement;
    dragging: boolean;
  } | null = null;

  const end = (event: PointerEvent) => {
    if (!state || event.pointerId !== state.pointerId) return;
    state.card.classList.remove("is-list-drag-blocked");
    state = null;
    document.body.classList.remove("canvas-list-drag-blocked-active");
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const card = (event.target as Element).closest(
      ".workspace-list .list-cards .card.canvas-list-drag-blocked",
    );
    if (!(card instanceof HTMLElement)) return;
    state = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      card,
      dragging: false,
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!state || event.pointerId !== state.pointerId || state.dragging) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (dx * dx + dy * dy <= 9) return;
    state.dragging = true;
    state.card.classList.add("is-list-drag-blocked");
    document.body.classList.add("canvas-list-drag-blocked-active");
    const itemId = state.card.dataset.id;
    if (itemId) {
      window.dispatchEvent(
        new CustomEvent("vira:reveal-card", { detail: { id: itemId, smooth: false } }),
      );
    }
    event.preventDefault();
  };

  const onSelectStart = (event: Event) => {
    if (
      (event.target as Element).closest(
        ".workspace-list .list-cards .card.canvas-list-drag-blocked.is-list-drag-blocked",
      )
    ) {
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
