import { CARD_WIDTH, DROP_OFFSET_Y, clampPlacement, clampZoom } from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { refPickModeActive, tryConsumeRefPick } from "../text/bindRefPickFromCard.ts";
import { isCanvasCardTypingTarget, shouldStartCanvasCardDrag } from "./canvasCardDrag.ts";
import { movesForCanvasGroupDrag } from "./canvasGroupDrag.ts";
import {
  isCanvasScrollKey,
  isSpaceKey,
  shouldBlockCanvasScrollNavigation,
  shouldRemoveCanvasSelectionOnKey,
  shouldStartCanvasSpacePan,
} from "./canvasKeyboard.ts";
import { mergeMarqueeSelection, resolveCanvasDragGroup } from "./canvasSelection.ts";
import {
  normalizeClientRect,
  placedIdsInMarquee,
  positionMarqueeElement,
  shouldStartCanvasMarquee,
} from "./canvasMarquee.ts";
import { noteListCardDragEnded } from "./listCardDrag.ts";
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
  const marqueeHost =
    surface.closest<HTMLElement>(".canvas-surface-shell") ?? surface.parentElement ?? surface;
  const marqueeEl = document.createElement("div");
  marqueeEl.className = "canvas-marquee";
  marqueeEl.setAttribute("aria-hidden", "true");
  marqueeHost.appendChild(marqueeEl);

  let pan: { id: number; x: number; y: number; left: number; top: number } | null = null;
  let marquee: {
    id: number;
    sx: number;
    sy: number;
    additive: boolean;
    baseIds: string[];
    active: boolean;
  } | null = null;
  let drag: {
    id: number;
    cardId: string;
    cardEl: HTMLElement;
    ox: number;
    oy: number;
    sx: number;
    sy: number;
    on: boolean;
    captured: boolean;
    shiftToggle?: string;
    groupIds?: string[];
    groupStart?: Record<string, { x: number; y: number }>;
    anchorStart?: { x: number; y: number };
  } | null = null;
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

  const releaseDragCapture = () => {
    if (!drag?.captured) return;
    try {
      drag.cardEl.releasePointerCapture(drag.id);
    } catch {
      /* pointer already released */
    }
    drag.captured = false;
  };

  const clearMarquee = () => {
    marqueeEl.classList.remove("is-visible");
    marqueeEl.setAttribute("aria-hidden", "true");
    surface.classList.remove("is-marquee-active");
    marquee = null;
  };

  const setGroupDraggingClass = (ids: string[], on: boolean) => {
    for (const id of ids) {
      surface.querySelector(`[data-canvas-placed="${id}"]`)?.classList.toggle("is-dragging", on);
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Element;
    if (tryConsumeRefPick(event)) return;
    if (refPickModeActive() && target.closest("[data-ref-pick]") && !target.closest("button, [data-action]")) return;
    if (target.closest("[data-canvas-spawn]")) return;
    const placedCard = target.closest<HTMLElement>(".canvas-placed-card");
    if (!placedCard && target.closest("button, [data-action]")) return;
    if (isCanvasCardTypingTarget(target)) return;
    commitEditOutsideCard(target);
    const middle = event.button === 1;
    const background = event.button === 0 && !placedCard;
    if (middle || shouldStartCanvasSpacePan(space, event.button)) {
      pan = { id: event.pointerId, x: event.clientX, y: event.clientY, left: surface.scrollLeft, top: surface.scrollTop };
      surface.classList.add("is-panning");
      surface.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }
    if (background && event.button === 0) {
      const selection = useDocument.getState().canvasSelection;
      marquee = {
        id: event.pointerId,
        sx: event.clientX,
        sy: event.clientY,
        additive: event.shiftKey,
        baseIds: event.shiftKey ? [...selection] : [],
        active: false,
      };
      return;
    }
    if (!placedCard || event.button !== 0) return;
    const id = placedCard.dataset.canvasPlaced;
    const pos = id ? useDocument.getState().canvasPlacements[id] : null;
    if (!id || !pos) return;
    const selection = useDocument.getState().canvasSelection;
    if (event.shiftKey) {
      /* toggle on pointerup if this stays a click */
    } else if (!selection.includes(id)) {
      useDocument.getState().setCanvasSelection([id]);
    }
    const pt = worldPoint(event.clientX, event.clientY);
    drag = {
      id: event.pointerId,
      cardId: id,
      cardEl: placedCard,
      ox: pt.x - pos.x,
      oy: pt.y - pos.y,
      sx: event.clientX,
      sy: event.clientY,
      on: false,
      captured: false,
      shiftToggle: event.shiftKey ? id : undefined,
    };
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
    if (marquee && event.pointerId === marquee.id) {
      if (!marquee.active && !shouldStartCanvasMarquee(marquee.sx, marquee.sy, event.clientX, event.clientY)) return;
      if (!marquee.active) {
        marquee.active = true;
        marqueeEl.classList.add("is-visible");
        marqueeEl.setAttribute("aria-hidden", "false");
        surface.classList.add("is-marquee-active");
      }
      const box = normalizeClientRect(marquee.sx, marquee.sy, event.clientX, event.clientY);
      positionMarqueeElement(marqueeEl, box);
      const hit = placedIdsInMarquee(surface, box);
      useDocument.getState().setCanvasSelection(mergeMarqueeSelection(marquee.baseIds, hit));
      event.preventDefault();
      return;
    }
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.on && !shouldStartCanvasCardDrag(drag.sx, drag.sy, event.clientX, event.clientY)) return;
    if (!drag.on) {
      drag.on = true;
      if (document.activeElement instanceof HTMLElement && surface.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      const state = useDocument.getState();
      const groupIds = resolveCanvasDragGroup(state.canvasSelection, drag.cardId);
      drag.groupIds = groupIds;
      drag.groupStart = {};
      for (const gid of groupIds) {
        const p = state.canvasPlacements[gid];
        if (p) drag.groupStart[gid] = { x: p.x, y: p.y };
      }
      drag.anchorStart = { ...state.canvasPlacements[drag.cardId]! };
      for (const gid of groupIds) state.bringToFront(gid);
      setGroupDraggingClass(groupIds, true);
      document.body.classList.add("canvas-card-drag-active");
      try {
        drag.cardEl.setPointerCapture(event.pointerId);
        drag.captured = true;
      } catch {
        /* inactive pointer */
      }
    }
    const current = drag;
    const pt = worldPoint(event.clientX, event.clientY);
    const anchorNext = clampPlacement(pt.x - current.ox, pt.y - current.oy);
    const groupIds = current.groupIds ?? [current.cardId];
    const anchorStart = current.anchorStart ?? anchorNext;
    const moves = movesForCanvasGroupDrag(
      groupIds,
      current.groupStart ?? {},
      anchorStart,
      anchorNext,
    );
    useDocument.getState().movePlacements(moves);
    event.preventDefault();
  };
  const onPointerUp = (event: PointerEvent) => {
    if (pan && event.pointerId === pan.id) {
      pan = null;
      surface.classList.remove("is-panning");
    }
    if (marquee && event.pointerId === marquee.id) {
      if (!marquee.active && !marquee.additive) useDocument.getState().clearCanvasSelection();
      clearMarquee();
    }
    if (drag && event.pointerId === drag.id) {
      if (!drag.on && drag.shiftToggle) {
        useDocument.getState().toggleCanvasSelection(drag.shiftToggle);
      }
      if (drag.on) {
        suppressUntil = Date.now() + 350;
        noteListCardDragEnded();
      }
      releaseDragCapture();
      setGroupDraggingClass(drag.groupIds ?? [drag.cardId], false);
      document.body.classList.remove("canvas-card-drag-active");
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
  const typingInField = () =>
    document.activeElement instanceof HTMLElement
    && !!document.activeElement.closest("textarea, input, select, [contenteditable='true']");

  const onKeyDown = (event: KeyboardEvent) => {
    const typing = typingInField();
    if ((event.key === "c" || event.key === "C") && !event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (typing || !hotspot.over || useDocument.getState().viewMode !== "list") return;
      event.preventDefault();
      const id = useDocument.getState().createBlankCard("canvas");
      if (!id) return;
      const pt = worldPoint(hotspot.x, hotspot.y);
      useDocument.getState().placeAtWorld(id, pt.x - CARD_WIDTH / 2, pt.y - DROP_OFFSET_Y);
      return;
    }
    if (
      isCanvasScrollKey(event)
      && shouldBlockCanvasScrollNavigation({
        typing,
        pointerOverCanvas: hotspot.over,
        focusNode: document.activeElement,
        canvasSurface: surface,
      })
    ) {
      event.preventDefault();
      if (isSpaceKey(event) && !event.repeat && !typing) {
        space = true;
        document.body.classList.add("canvas-space-pan");
      }
      return;
    }
    if (event.key === "Escape" && !typing) {
      useDocument.getState().clearCanvasSelection();
      return;
    }
    const doc = useDocument.getState();
    if (
      shouldRemoveCanvasSelectionOnKey({
        key: event,
        typing,
        selectionCount: doc.canvasSelection.length,
        viewMode: doc.viewMode,
      })
    ) {
      event.preventDefault();
      doc.removeCanvasSelectionFromCanvas();
    }
  };
  const clearSpacePan = () => {
    space = false;
    document.body.classList.remove("canvas-space-pan");
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (!isSpaceKey(event)) return;
    clearSpacePan();
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
  window.addEventListener("pointermove", onPointerMove, true);
  window.addEventListener("pointerup", onPointerUp, true);
  window.addEventListener("pointercancel", onPointerUp, true);
  surface.addEventListener("wheel", onWheel, { passive: false });
  surface.addEventListener("scroll", onScroll);
  surface.addEventListener("click", onClick, true);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", clearSpacePan);
  window.addEventListener("pointermove", onMove);
  const unbindDrop = bindCanvasDrop(surface, spawnGesture);
  const unbindReveal = bindCanvasReveal(surface);
  return () => {
    surface.removeEventListener("pointerdown", onPointerDown);
    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerup", onPointerUp, true);
    window.removeEventListener("pointercancel", onPointerUp, true);
    releaseDragCapture();
    document.body.classList.remove("canvas-card-drag-active");
    surface.removeEventListener("wheel", onWheel);
    surface.removeEventListener("scroll", onScroll);
    surface.removeEventListener("click", onClick, true);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", clearSpacePan);
    window.removeEventListener("pointermove", onMove);
    unbindDrop();
    unbindReveal();
    clearMarquee();
    marqueeEl.remove();
    document.body.classList.remove("canvas-space-pan");
  };
}
