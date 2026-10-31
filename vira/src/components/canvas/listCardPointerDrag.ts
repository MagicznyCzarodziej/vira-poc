import { CARD_WIDTH, DROP_OFFSET_Y } from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { isListCardDragField, noteListCardDragEnded } from "./listCardDrag.ts";
import { clearListCardDragGhost, syncListCardDragGhost } from "./listCardPointerDragGhost.ts";

export const LIST_CARD_DRAG_THRESHOLD_PX = 5;

export type ListCardPointerDragSession = {
  id: string;
  card: HTMLElement;
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
};

export type ListCardPointerDragDeps = {
  placeAtWorld: (id: string, x: number, y: number) => void;
  findCanvasSurface: (clientX: number, clientY: number) => HTMLElement | null;
  canvasWorldPoint: (surface: HTMLElement, clientX: number, clientY: number) => { x: number; y: number };
};

export function shouldStartListCardPointerDrag(
  session: ListCardPointerDragSession | null,
  clientX: number,
  clientY: number,
  thresholdPx = LIST_CARD_DRAG_THRESHOLD_PX,
): boolean {
  if (!session || session.dragging) return false;
  const dx = clientX - session.startX;
  const dy = clientY - session.startY;
  return dx * dx + dy * dy > thresholdPx * thresholdPx;
}

export function finishListCardPointerDrag(
  session: ListCardPointerDragSession,
  clientX: number,
  clientY: number,
  deps: ListCardPointerDragDeps,
): boolean {
  if (!session.dragging) return false;
  noteListCardDragEnded();
  const surface = deps.findCanvasSurface(clientX, clientY);
  if (!surface) return false;
  const pt = deps.canvasWorldPoint(surface, clientX, clientY);
  deps.placeAtWorld(session.id, pt.x - CARD_WIDTH / 2, pt.y - DROP_OFFSET_Y);
  return true;
}

export function createListCardPointerDragDeps(): ListCardPointerDragDeps {
  return {
    placeAtWorld: (id, x, y) => useDocument.getState().placeAtWorld(id, x, y),
    findCanvasSurface: (clientX, clientY) =>
      document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-canvas-surface]") ?? null,
    canvasWorldPoint: (surface, clientX, clientY) => {
      const rect = surface.getBoundingClientRect();
      const zoom = useDocument.getState().canvasViewport.zoom;
      return {
        x: (surface.scrollLeft + clientX - rect.left) / zoom,
        y: (surface.scrollTop + clientY - rect.top) / zoom,
      };
    },
  };
}

function releaseCapture(session: ListCardPointerDragSession) {
  try {
    session.card.releasePointerCapture(session.pointerId);
  } catch {
    /* pointer already released */
  }
}

export function bindListCardPointerDrag(root: HTMLElement, deps: ListCardPointerDragDeps): () => void {
  let session: ListCardPointerDragSession | null = null;

  const clearSession = () => {
    if (session) releaseCapture(session);
    session?.card.classList.remove("is-list-pointer-dragging");
    document.body.classList.remove("list-card-pointer-drag-active");
    clearListCardDragGhost();
    session = null;
  };

  const onPointerDown = (event: Event) => {
    if (!(event instanceof PointerEvent) || event.button !== 0) return;
    const card = (event.target as Element).closest<HTMLElement>("[data-canvas-drag-id]");
    const id = card?.dataset.canvasDragId;
    if (!card || !id) return;
    if (isListCardDragField(event.target)) return;
    session = {
      id,
      card,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
  };

  const onPointerMove = (event: Event) => {
    if (!(event instanceof PointerEvent) || !session || event.pointerId !== session.pointerId) return;
    if (shouldStartListCardPointerDrag(session, event.clientX, event.clientY)) {
      if (!session.dragging) {
        session.dragging = true;
        session.card.classList.add("is-list-pointer-dragging");
        document.body.classList.add("list-card-pointer-drag-active");
        try {
          session.card.setPointerCapture(event.pointerId);
        } catch {
          /* inactive pointer */
        }
        syncListCardDragGhost(session.card, event.clientX, event.clientY);
      }
    }
    if (session.dragging) {
      syncListCardDragGhost(session.card, event.clientX, event.clientY);
      event.preventDefault();
    }
  };

  const end = (event: Event) => {
    if (!(event instanceof PointerEvent) || !session || event.pointerId !== session.pointerId) return;
    const current = session;
    clearSession();
    finishListCardPointerDrag(current, event.clientX, event.clientY, deps);
  };

  root.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointermove", onPointerMove, true);
  window.addEventListener("pointerup", end, true);
  window.addEventListener("pointercancel", end, true);
  return () => {
    clearSession();
    root.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerup", end, true);
    window.removeEventListener("pointercancel", end, true);
  };
}
