import { ACTION_DROP_OFFSET_Y, ACTION_POINT_WIDTH } from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import {
  LIST_CARD_DRAG_THRESHOLD_PX,
  shouldStartListCardPointerDrag,
  type ListCardPointerDragSession,
} from "./listCardPointerDrag.ts";
import {
  beginActionPointLinkDrag,
  endActionPointLinkDrag,
  finishActionPointLinkDrop,
  syncActionPointLinkDropHighlight,
} from "./actionPointLinkDrag.ts";
import { syncActionPointLinkDragGhost } from "./actionPointLinkDragGhost.ts";
import {
  clearListActionPointDragGhost,
  syncListActionPointDragGhost,
} from "./listActionPointPointerDragGhost.ts";

export type ListActionPointPointerDragSession = ListCardPointerDragSession & {
  el: HTMLElement;
  mode: "place" | "link";
};

export type ListActionPointPointerDragDeps = {
  placeActionPointAtWorld: (id: string, x: number, y: number) => void;
  findCanvasSurface: (clientX: number, clientY: number) => HTMLElement | null;
  canvasWorldPoint: (surface: HTMLElement, clientX: number, clientY: number) => { x: number; y: number };
};

export function finishListActionPointPointerDrag(
  session: ListActionPointPointerDragSession,
  clientX: number,
  clientY: number,
  deps: ListActionPointPointerDragDeps,
): boolean {
  if (!session.dragging) return false;
  const surface = deps.findCanvasSurface(clientX, clientY);
  if (!surface) return false;
  const pt = deps.canvasWorldPoint(surface, clientX, clientY);
  deps.placeActionPointAtWorld(
    session.id,
    pt.x - ACTION_POINT_WIDTH / 2,
    pt.y - ACTION_DROP_OFFSET_Y,
  );
  return true;
}

export function createListActionPointPointerDragDeps(): ListActionPointPointerDragDeps {
  return {
    placeActionPointAtWorld: (id, x, y) => useDocument.getState().placeActionPointAtWorld(id, x, y),
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

export function enterListActionPointLinkMode(
  session: ListActionPointPointerDragSession,
  clientX: number,
  clientY: number,
): void {
  if (session.mode === "link") return;
  session.mode = "link";
  document.body.classList.remove("list-action-point-pointer-drag-active");
  clearListActionPointDragGhost();
  beginActionPointLinkDrag();
  if (session.dragging) {
    syncActionPointLinkDragGhost(session.el, clientX, clientY);
    syncActionPointLinkDropHighlight(clientX, clientY);
  }
}

function releaseCapture(session: ListActionPointPointerDragSession) {
  try {
    session.el.releasePointerCapture(session.pointerId);
  } catch {
    /* pointer already released */
  }
}

export function bindListActionPointPointerDrag(
  root: HTMLElement,
  deps: ListActionPointPointerDragDeps = createListActionPointPointerDragDeps(),
): () => void {
  let session: ListActionPointPointerDragSession | null = null;

  const clearSession = () => {
    if (session) releaseCapture(session);
    session?.el.classList.remove("is-list-pointer-dragging");
    document.body.classList.remove("list-action-point-pointer-drag-active");
    endActionPointLinkDrag();
    clearListActionPointDragGhost();
    session = null;
  };

  const onPointerDown = (event: Event) => {
    if (!(event instanceof PointerEvent) || event.button !== 0) return;
    const el = (event.target as Element).closest<HTMLElement>("[data-canvas-drag-ap-id]");
    const id = el?.dataset.canvasDragApId;
    if (!el || !id) return;
    if ((event.target as Element).closest("button, input, textarea, label")) return;
    session = {
      id,
      el,
      card: el,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      mode: event.shiftKey ? "link" : "place",
    };
  };

  const onPointerMove = (event: Event) => {
    if (!(event instanceof PointerEvent) || !session || event.pointerId !== session.pointerId) return;
    if (session.mode === "place" && event.shiftKey) {
      enterListActionPointLinkMode(session, event.clientX, event.clientY);
    }
    if (shouldStartListCardPointerDrag(session, event.clientX, event.clientY, LIST_CARD_DRAG_THRESHOLD_PX)) {
      if (!session.dragging) {
        session.dragging = true;
        session.el.classList.add("is-list-pointer-dragging");
        try {
          session.el.setPointerCapture(event.pointerId);
        } catch {
          /* inactive pointer */
        }
        if (session.mode === "link") {
          beginActionPointLinkDrag();
        } else {
          document.body.classList.add("list-action-point-pointer-drag-active");
          syncListActionPointDragGhost(session.el, event.clientX, event.clientY);
        }
      }
    }
    if (session.dragging) {
      if (session.mode === "link") {
        syncActionPointLinkDragGhost(session.el, event.clientX, event.clientY);
        syncActionPointLinkDropHighlight(event.clientX, event.clientY);
      } else {
        syncListActionPointDragGhost(session.el, event.clientX, event.clientY);
      }
      event.preventDefault();
    }
  };

  const end = (event: Event) => {
    if (!(event instanceof PointerEvent) || !session || event.pointerId !== session.pointerId) return;
    const current = session;
    clearSession();
    if (current.mode === "link") {
      if (current.dragging) finishActionPointLinkDrop(current.id, event.clientX, event.clientY);
      return;
    }
    finishListActionPointPointerDrag(current, event.clientX, event.clientY, deps);
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
