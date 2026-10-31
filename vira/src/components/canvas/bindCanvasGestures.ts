import { CARD_WIDTH, DROP_OFFSET_Y, clampPlacement, clampZoom } from "../../domain/index.ts";
import { useDocument } from "../../store/useDocument.ts";
import { refPickModeActive, tryConsumeRefPick } from "../text/bindRefPickFromCard.ts";
import { bindCanvasReveal } from "./bindCanvasReveal.ts";
import { bindCanvasDrop, type SpawnGesture } from "./canvasDrop.ts";

function commitEditOutsideCard(target: Element) {
  const active = document.activeElement;
  if (!(active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement)) return;
  if (!useDocument.getState().editing) return;
  const host = active.closest(".card");
  if (host && target.closest(".card") === host) return;
  useDocument.getState().commitEdit(active.value);
}

export function bindCanvasGestures(surface: HTMLElement, spawnGesture: { readonly current: SpawnGesture | null }): () => void {
  let pan: { id: number; x: number; y: number; left: number; top: number } | null = null;
  let drag: { id: number; cardId: string; ox: number; oy: number; sx: number; sy: number; on: boolean } | null = null;
  let space = false;
  let hotspot = { x: 0, y: 0, over: false };
  let suppressUntil = 0;

  const worldPoint = (clientX: number, clientY: number) => {
    const rect = surface.getBoundingClientRect();
    const zoom = useDocument.getState().canvasViewport.zoom;
    return {
      x: (surface.scrollLeft + clientX - rect.left) / zoom,
      y: (surface.scrollTop + clientY - rect.top) / zoom,
    };
  };

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Element;
    if (tryConsumeRefPick(event)) return;
    if (refPickModeActive() && target.closest("[data-ref-pick]") && !target.closest("button, [data-action]")) return;
    if (target.closest("[data-canvas-spawn], button, [data-action]")) return;
    const field = target.closest("textarea, input");
    if (field && document.activeElement === field) return;
    commitEditOutsideCard(target);
    const card = target.closest<HTMLElement>(".canvas-placed-card");
    const middle = event.button === 1;
    const background = event.button === 0 && !card;
    const spacePan = space && event.button === 0;
    if (middle || background || spacePan) {
      pan = { id: event.pointerId, x: event.clientX, y: event.clientY, left: surface.scrollLeft, top: surface.scrollTop };
      surface.classList.add("is-panning");
      surface.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }
    if (!card || event.button !== 0) return;
    const id = card.dataset.canvasPlaced;
    const pos = id ? useDocument.getState().canvasPlacements[id] : null;
    if (!id || !pos) return;
    const pt = worldPoint(event.clientX, event.clientY);
    drag = { id: event.pointerId, cardId: id, ox: pt.x - pos.x, oy: pt.y - pos.y, sx: event.clientX, sy: event.clientY, on: false };
  };
  const onPointerMove = (event: PointerEvent) => {
    if (pan && event.pointerId === pan.id) {
      surface.scrollLeft = pan.left - (event.clientX - pan.x);
      surface.scrollTop = pan.top - (event.clientY - pan.y);
      useDocument.getState().setViewport({
        ...useDocument.getState().canvasViewport,
        scrollLeft: surface.scrollLeft,
        scrollTop: surface.scrollTop,
      });
      return;
    }
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.sx;
    const dy = event.clientY - drag.sy;
    if (!drag.on && dx * dx + dy * dy <= 16) return;
    if (!drag.on) {
      drag.on = true;
      if (document.activeElement instanceof HTMLElement && surface.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      useDocument.getState().bringToFront(drag.cardId);
    }
    const pt = worldPoint(event.clientX, event.clientY);
    const next = clampPlacement(pt.x - drag.ox, pt.y - drag.oy);
    const el = surface.querySelector<HTMLElement>(`[data-canvas-placed="${drag.cardId}"]`);
    if (el) {
      el.style.left = `${next.x}px`;
      el.style.top = `${next.y}px`;
      el.classList.add("is-dragging");
    }
    drag.ox = drag.ox;
    (drag as { next?: { x: number; y: number } }).next = next;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (pan && event.pointerId === pan.id) {
      pan = null;
      surface.classList.remove("is-panning");
    }
    if (drag && event.pointerId === drag.id) {
      const next = (drag as { next?: { x: number; y: number } }).next;
      if (drag.on && next) {
        suppressUntil = Date.now() + 350;
        useDocument.getState().movePlacement(drag.cardId, next.x, next.y);
      }
      surface.querySelector(`[data-canvas-placed="${drag.cardId}"]`)?.classList.remove("is-dragging");
      drag = null;
    }
  };
  const onWheel = (event: WheelEvent) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const current = useDocument.getState().canvasViewport;
    const rect = surface.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const worldX = (surface.scrollLeft + mx) / current.zoom;
    const worldY = (surface.scrollTop + my) / current.zoom;
    const zoom = clampZoom(current.zoom * Math.exp(-event.deltaY * 0.002));
    useDocument.getState().setViewport({
      zoom,
      scrollLeft: Math.max(0, worldX * zoom - mx),
      scrollTop: Math.max(0, worldY * zoom - my),
    });
  };
  const onScroll = () => {
    if (pan) return;
    const current = useDocument.getState().canvasViewport;
    if (surface.scrollLeft === current.scrollLeft && surface.scrollTop === current.scrollTop) return;
    useDocument.getState().setViewport({ ...current, scrollLeft: surface.scrollLeft, scrollTop: surface.scrollTop });
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const typing = document.activeElement instanceof HTMLElement
      && !!document.activeElement.closest("textarea, input, select, [contenteditable='true']");
    if ((event.key === "c" || event.key === "C") && !event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (typing || !hotspot.over || useDocument.getState().viewMode !== "list") return;
      event.preventDefault();
      const id = useDocument.getState().createBlankCard("canvas");
      if (!id) return;
      const pt = worldPoint(hotspot.x, hotspot.y);
      useDocument.getState().placeAtWorld(id, pt.x - CARD_WIDTH / 2, pt.y - DROP_OFFSET_Y);
      return;
    }
    if (event.code === " " && !event.repeat && !typing) {
      space = true;
      document.body.classList.add("canvas-space-pan");
      event.preventDefault();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.code !== " ") return;
    space = false;
    document.body.classList.remove("canvas-space-pan");
  };
  const onMove = (event: PointerEvent) => {
    const rect = surface.getBoundingClientRect();
    hotspot = {
      x: event.clientX,
      y: event.clientY,
      over: event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom,
    };
  };
  const onClick = (event: MouseEvent) => {
    if (Date.now() < suppressUntil && (event.target as Element).closest(".canvas-placed-card")) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  surface.addEventListener("pointerdown", onPointerDown);
  surface.addEventListener("pointermove", onPointerMove);
  surface.addEventListener("pointerup", onPointerUp);
  surface.addEventListener("pointercancel", onPointerUp);
  surface.addEventListener("wheel", onWheel, { passive: false });
  surface.addEventListener("scroll", onScroll);
  surface.addEventListener("click", onClick, true);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointermove", onMove);
  const unbindDrop = bindCanvasDrop(surface, spawnGesture);
  const unbindReveal = bindCanvasReveal(surface);
  return () => {
    surface.removeEventListener("pointerdown", onPointerDown);
    surface.removeEventListener("pointermove", onPointerMove);
    surface.removeEventListener("pointerup", onPointerUp);
    surface.removeEventListener("pointercancel", onPointerUp);
    surface.removeEventListener("wheel", onWheel);
    surface.removeEventListener("scroll", onScroll);
    surface.removeEventListener("click", onClick, true);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("pointermove", onMove);
    unbindDrop();
    unbindReveal();
    document.body.classList.remove("canvas-space-pan");
  };
}
