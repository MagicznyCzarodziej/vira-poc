import { CARD_WIDTH, DROP_OFFSET_Y, clampPlacement, clampZoom } from "../../domain/index.ts";
import { scrollForZoomAtPoint } from "./canvasWorldZoom.ts";
import type { ComposerIntent } from "../../store/documentTypes.ts";
import { useDocument } from "../../store/index.ts";
import { refPickModeActive, tryConsumeRefPick } from "../text/bindRefPickFromCard.ts";
import { tryBeginCanvasEditFromPointer } from "./canvasCardEdit.ts";
import {
  isCanvasCardEditSurface,
  isCanvasCardTypingTarget,
  shouldStartCanvasCardDrag,
} from "./canvasCardDrag.ts";
import { movesForCanvasGroupDrag } from "./canvasGroupDrag.ts";
import { applyCanvasDragTransform, clearCanvasDragTransform } from "./canvasDragPreview.ts";
import { commitCanvasGroupMoves } from "./canvasPlaced.ts";
import { flush } from "../../store/documentPersistence.ts";
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
import { requestCanvasReveal } from "./flyToCard.ts";
import { bindCanvasDrop, type SpawnGesture } from "./canvasDrop.ts";
import {
  beginActionPointLinkDrag,
  endActionPointLinkDrag,
  finishActionPointLinkDrop,
  syncActionPointLinkDropHighlight,
} from "./actionPointLinkDrag.ts";
import { syncActionPointLinkDragGhost } from "./actionPointLinkDragGhost.ts";
import { syncIssueRefLinkDragGhost } from "./issueRefLinkDragGhost.ts";
import {
  beginIssueRefLinkDrag,
  endIssueRefLinkDrag,
  finishIssueRefLinkDrop,
  issueRefLinkSourceFromPlacedCard,
  issueRefLinkSourceFromTarget,
  syncIssueRefLinkDropHighlight,
  type IssueRefLinkSource,
} from "../text/issueRefLinkDrag.ts";
import {
  cardPlacementKeysInDragGroup,
  noteIdsInDragGroup,
  remapCanvasDragGroupForAltDuplicate,
} from "./canvasAltDuplicateDrag.ts";
import {
  expandCanvasDragGroupWithFrameContents,
  pickFrameIdAtWorldPoint,
} from "./canvasFrameContainment.ts";
import {
  canvasPlacedHostFromTarget,
  canvasPlacedId,
  canvasWorldPlacement,
  isCanvasActionPointId,
  isCanvasCardPlacementId,
  isCanvasFrameId,
  isCanvasNoteId,
} from "./canvasPlaced.ts";
import type { FrameRect, FrameResizeHandle } from "../../domain/index.ts";
import { parseFrameResizeHandle } from "../frame/frameResizeHandles.ts";
import {
  clampFrameDrawRect,
  frameDrawMeetsMinimum,
  frameRectFromClientDrag,
  shouldStartFrameDraw,
} from "./canvasFrameDraw.ts";

function commitEditOutsideCard(target: Element) {
  const active = document.activeElement;
  if (!(active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement)) return;
  if (!useDocument.getState().editing) return;
  const host = active.closest(".card, .action-point-card, .canvas-sticky-note");
  if (host && target.closest(".card, .action-point-card, .canvas-sticky-note") === host) return;
  useDocument.getState().commitEdit(active.value);
}

export function bindCanvasGestures(surface: HTMLElement, spawnGesture: { readonly current: SpawnGesture | null }): () => void {
  const marqueeHost =
    surface.closest<HTMLElement>(".canvas-surface-shell") ?? surface.parentElement ?? surface;
  const marqueeEl = document.createElement("div");
  marqueeEl.className = "canvas-marquee";
  marqueeEl.setAttribute("aria-hidden", "true");
  marqueeHost.appendChild(marqueeEl);
  const frameDrawEl = document.createElement("div");
  frameDrawEl.className = "canvas-frame-draw";
  frameDrawEl.setAttribute("aria-hidden", "true");
  marqueeHost.appendChild(frameDrawEl);

  let pan: { id: number; x: number; y: number; left: number; top: number } | null = null;
  let frameDraw: { id: number; sx: number; sy: number; active: boolean } | null = null;
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
    placedId: string;
    placedEl: HTMLElement;
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
    editTap?: boolean;
    pointerTarget?: EventTarget;
    altDuplicate?: boolean;
    altDupKeyMap?: Record<string, string>;
    altDupOrigGroupIds?: string[];
    altDupOrigGroupStart?: Record<string, { x: number; y: number }>;
    altDupOrigPlacedId?: string;
    /** Skip one group move after leaving alt-duplicate so the original stays put. */
    suppressGroupMoveOnce?: boolean;
  } | null = null;
  let frameResize: {
    id: number;
    placedId: string;
    kind: "frame" | "note";
    handle: FrameResizeHandle;
    start: FrameRect;
    sx: number;
    sy: number;
    captured: boolean;
    el: HTMLElement;
  } | null = null;
  let apLink: {
    id: number;
    apId: string;
    el: HTMLElement;
    sx: number;
    sy: number;
    active: boolean;
    captured: boolean;
  } | null = null;
  let cardRefLink: {
    id: number;
    source: IssueRefLinkSource;
    el: HTMLElement;
    sx: number;
    sy: number;
    active: boolean;
    captured: boolean;
  } | null = null;
  let space = false;
  let hotspot = { x: 0, y: 0, over: false };
  let suppressUntil = 0;
  let marqueeSelectionRaf = 0;
  let marqueeSelectionBox: ReturnType<typeof normalizeClientRect> | null = null;

  const scheduleMarqueeSelection = (box: ReturnType<typeof normalizeClientRect>) => {
    marqueeSelectionBox = box;
    if (marqueeSelectionRaf) return;
    marqueeSelectionRaf = requestAnimationFrame(() => {
      marqueeSelectionRaf = 0;
      if (!marquee || !marqueeSelectionBox) return;
      const hit = placedIdsInMarquee(surface, marqueeSelectionBox);
      useDocument.getState().setCanvasSelection(mergeMarqueeSelection(marquee.baseIds, hit));
    });
  };

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
      drag.placedEl.releasePointerCapture(drag.id);
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

  const clearFrameDraw = () => {
    frameDrawEl.classList.remove("is-visible");
    frameDrawEl.setAttribute("aria-hidden", "true");
    surface.classList.remove("is-frame-draw-active");
    frameDraw = null;
  };

  const setGroupDraggingClass = (ids: string[], on: boolean) => {
    for (const id of ids) {
      surface.querySelector(`[data-canvas-placed="${id}"]`)?.classList.toggle("is-dragging", on);
    }
  };

  const revertCanvasGroupToDragStart = (current: NonNullable<typeof drag>) => {
    const store = useDocument.getState();
    const groupIds = current.groupIds ?? [current.placedId];
    clearCanvasDragTransform(surface, groupIds);
    const groupStart = current.groupStart ?? {};
    const moves: { id: string; x: number; y: number }[] = [];
    for (const gid of groupIds) {
      const start = groupStart[gid];
      if (start) moves.push({ id: gid, x: start.x, y: start.y });
    }
    if (moves.length === 0) return;
    commitCanvasGroupMoves(store, moves);
  };

  const maybeCancelAltDuplicateCanvasDrag = (event: Pick<PointerEvent, "pointerId">) => {
    if (
      !drag?.on
      || !drag.altDuplicate
      || !drag.altDupKeyMap
      || !drag.altDupOrigGroupIds
      || !drag.altDupOrigGroupStart
      || !drag.altDupOrigPlacedId
    ) {
      return;
    }
    const keyMap = drag.altDupKeyMap;
    const origGroupIds = drag.altDupOrigGroupIds;
    const origGroupStart = drag.altDupOrigGroupStart;
    const copyGroupIds = drag.groupIds ?? [];
    const copyKeys = new Set(Object.values(keyMap));
    const store = useDocument.getState();

    for (const copyId of copyGroupIds) {
      if (!copyKeys.has(copyId)) continue;
      if (store.canvasPlacements[copyId]) store.removeFromCanvas(copyId);
      else if (store.notes[copyId]) store.removeNoteFromCanvas(copyId);
    }

    const revertMoves: { id: string; x: number; y: number }[] = [];
    for (const gid of origGroupIds) {
      const start = origGroupStart[gid];
      if (!start) continue;
      const current = canvasWorldPlacement(store, gid);
      if (!current || current.x !== start.x || current.y !== start.y) {
        revertMoves.push({ id: gid, x: start.x, y: start.y });
      }
    }
    if (revertMoves.length > 0) {
      commitCanvasGroupMoves(store, revertMoves);
    }

    setGroupDraggingClass(copyGroupIds, false);

    const origAnchor = origGroupStart[drag.altDupOrigPlacedId];

    drag.groupIds = [...origGroupIds];
    drag.groupStart = { ...origGroupStart };
    drag.placedId = drag.altDupOrigPlacedId;
    drag.anchorStart = origAnchor ? { ...origAnchor } : drag.anchorStart;
    drag.altDuplicate = false;
    drag.suppressGroupMoveOnce = true;
    delete drag.altDupKeyMap;
    delete drag.altDupOrigGroupIds;
    delete drag.altDupOrigGroupStart;
    delete drag.altDupOrigPlacedId;

    store.setCanvasSelection([...origGroupIds]);
    setGroupDraggingClass(origGroupIds, true);

    const origEl = surface.querySelector<HTMLElement>(`[data-canvas-placed="${drag.placedId}"]`);
    if (origEl) {
      try {
        if (drag.captured) drag.placedEl.releasePointerCapture(event.pointerId);
        drag.placedEl = origEl;
        origEl.setPointerCapture(event.pointerId);
        drag.captured = true;
      } catch {
        /* inactive pointer */
      }
    }
  };

  const maybeBeginAltDuplicateCanvasDrag = (event: PointerEvent) => {
    if (!drag?.on || drag.altDuplicate || !event.altKey || event.shiftKey) return;
    const store = useDocument.getState();
    const groupIds = drag.groupIds ?? [drag.placedId];
    const cardKeys = cardPlacementKeysInDragGroup(store, groupIds);
    const noteKeys = noteIdsInDragGroup(store, groupIds);
    if (cardKeys.length === 0 && noteKeys.length === 0) return;

    revertCanvasGroupToDragStart(drag);
    const groupStart = drag.groupStart ?? {};
    const positions: Record<string, { x: number; y: number }> = {};
    for (const key of [...cardKeys, ...noteKeys]) {
      const start = groupStart[key];
      if (start) positions[key] = start;
    }
    const keyMap = {
      ...(cardKeys.length > 0 ? store.duplicateCardPlacementsForDrag(cardKeys, positions) : {}),
      ...(noteKeys.length > 0 ? store.duplicateNotesForDrag(noteKeys, positions) : {}),
    };
    const remapped = remapCanvasDragGroupForAltDuplicate(groupIds, groupStart, keyMap);
    const oldGroupIds = groupIds;
    const origPlacedId = drag.placedId;
    drag.groupIds = remapped.groupIds;
    drag.groupStart = remapped.groupStart;
    drag.placedId = keyMap[drag.placedId] ?? drag.placedId;
    drag.altDuplicate = true;
    drag.altDupKeyMap = keyMap;
    drag.altDupOrigGroupIds = [...oldGroupIds];
    drag.altDupOrigGroupStart = { ...groupStart };
    drag.altDupOrigPlacedId = origPlacedId;

    setGroupDraggingClass(oldGroupIds, false);
    for (const gid of remapped.groupIds) {
      if (isCanvasActionPointId(store, gid)) continue;
      if (isCanvasNoteId(store, gid)) store.bringNoteToFront(gid);
      else if (isCanvasFrameId(store, gid)) store.bringFrameToFront(gid);
      else store.bringToFront(gid);
    }
    setGroupDraggingClass(remapped.groupIds, true);
    store.setCanvasSelection(remapped.groupIds);

    const newEl = surface.querySelector<HTMLElement>(`[data-canvas-placed="${drag.placedId}"]`);
    if (newEl) {
      try {
        if (drag.captured) drag.placedEl.releasePointerCapture(drag.id);
        drag.placedEl = newEl;
        newEl.setPointerCapture(event.pointerId);
        drag.captured = true;
      } catch {
        /* inactive pointer */
      }
    }
  };

  const beginCardRefLinkFromCanvasDrag = (
    event: PointerEvent,
    from: NonNullable<typeof drag>,
    source: IssueRefLinkSource,
  ) => {
    const pastThreshold = shouldStartCanvasCardDrag(from.sx, from.sy, event.clientX, event.clientY);
    const active = from.on || pastThreshold;

    if (from.on) revertCanvasGroupToDragStart(from);

    releaseDragCapture();
    setGroupDraggingClass(from.groupIds ?? [from.placedId], false);
    document.body.classList.remove("canvas-card-drag-active");

    cardRefLink = {
      id: event.pointerId,
      source,
      el: from.placedEl,
      sx: from.sx,
      sy: from.sy,
      active,
      captured: false,
    };
    drag = null;

    if (!active) return;

    beginIssueRefLinkDrag();
    cardRefLink.el.classList.add("is-issue-ref-link-dragging");
    try {
      cardRefLink.el.setPointerCapture(event.pointerId);
      cardRefLink.captured = true;
    } catch {
      /* inactive pointer */
    }
    syncIssueRefLinkDragGhost(cardRefLink.source.refToken, event.clientX, event.clientY);
    syncIssueRefLinkDropHighlight(event.clientX, event.clientY);
  };

  const beginApLinkFromCanvasDrag = (event: PointerEvent, from: NonNullable<typeof drag>) => {
    const pastThreshold = shouldStartCanvasCardDrag(from.sx, from.sy, event.clientX, event.clientY);
    const active = from.on || pastThreshold;

    if (from.on) revertCanvasGroupToDragStart(from);

    releaseDragCapture();
    setGroupDraggingClass(from.groupIds ?? [from.placedId], false);
    document.body.classList.remove("canvas-card-drag-active");

    apLink = {
      id: event.pointerId,
      apId: from.placedId,
      el: from.placedEl,
      sx: from.sx,
      sy: from.sy,
      active,
      captured: false,
    };
    drag = null;

    if (!active) return;

    beginActionPointLinkDrag();
    apLink.el.classList.add("is-ap-link-dragging");
    try {
      apLink.el.setPointerCapture(event.pointerId);
      apLink.captured = true;
    } catch {
      /* inactive pointer */
    }
    syncActionPointLinkDragGhost(apLink.el, event.clientX, event.clientY);
    syncActionPointLinkDropHighlight(event.clientX, event.clientY);
  };

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target as Element;
    if (tryConsumeRefPick(event)) return;
    if (refPickModeActive() && target.closest("[data-ref-pick]") && !target.closest("button, [data-action]")) return;
    if (target.closest("[data-canvas-spawn]")) return;
    const placedHost = canvasPlacedHostFromTarget(target);
    if (!placedHost && target.closest("button, [data-action]")) return;
    if (isCanvasCardTypingTarget(target)) return;
    commitEditOutsideCard(target);
    const middle = event.button === 1;
    const background = event.button === 0 && !placedHost;
    if (middle || shouldStartCanvasSpacePan(space, event.button)) {
      pan = { id: event.pointerId, x: event.clientX, y: event.clientY, left: surface.scrollLeft, top: surface.scrollTop };
      surface.classList.add("is-panning");
      surface.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }
    if (background && event.button === 0) {
      const tagFrameTag = useDocument.getState().tagFramePlacementTag;
      if (tagFrameTag) {
        const pt = worldPoint(event.clientX, event.clientY);
        const frameId = useDocument.getState().createFrameForTagOnCanvas(tagFrameTag, pt);
        useDocument.getState().cancelTagFramePlacement();
        if (frameId) requestCanvasReveal(frameId);
        event.preventDefault();
        return;
      }
      if (useDocument.getState().canvasTool === "frame") {
        frameDraw = {
          id: event.pointerId,
          sx: event.clientX,
          sy: event.clientY,
          active: false,
        };
        event.preventDefault();
        return;
      }
      if (!event.shiftKey) {
        const docForFramePick = useDocument.getState();
        const pt = worldPoint(event.clientX, event.clientY);
        const frameId = pickFrameIdAtWorldPoint(
          docForFramePick.framePlacements,
          docForFramePick.frames,
          pt.x,
          pt.y,
        );
        if (frameId) {
          const frameHost = surface.querySelector<HTMLElement>(`[data-canvas-placed="${frameId}"]`);
          const placement = docForFramePick.framePlacements[frameId];
          if (frameHost && placement) {
            if (!docForFramePick.canvasSelection.includes(frameId)) {
              docForFramePick.setCanvasSelection([frameId]);
            }
            drag = {
              id: event.pointerId,
              placedId: frameId,
              placedEl: frameHost,
              ox: pt.x - placement.x,
              oy: pt.y - placement.y,
              sx: event.clientX,
              sy: event.clientY,
              on: false,
              captured: false,
              pointerTarget: target,
            };
            event.preventDefault();
            return;
          }
        }
      }
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
    if (!placedHost || event.button !== 0) return;
    const id = canvasPlacedId(placedHost);
    const doc = useDocument.getState();
    const pos = id ? canvasWorldPlacement(doc, id) : null;
    if (!id || !pos) return;
    const frameResizeEl = target.closest<HTMLElement>("[data-frame-resize]");
    const frameHandle = parseFrameResizeHandle(frameResizeEl?.dataset.frameResize);
    if (frameResizeEl && frameHandle && placedHost.classList.contains("canvas-placed-frame")) {
      const placement = doc.framePlacements[id];
      if (placement) {
        frameResize = {
          id: event.pointerId,
          placedId: id,
          kind: "frame",
          handle: frameHandle,
          start: {
            x: placement.x,
            y: placement.y,
            width: placement.width,
            height: placement.height,
          },
          sx: event.clientX,
          sy: event.clientY,
          captured: false,
          el: placedHost,
        };
        try {
          placedHost.setPointerCapture(event.pointerId);
          frameResize.captured = true;
        } catch {
          /* inactive pointer */
        }
        event.preventDefault();
        return;
      }
    }
    const noteResizeEl = target.closest<HTMLElement>("[data-note-resize]");
    const noteHandle = parseFrameResizeHandle(noteResizeEl?.dataset.noteResize);
    if (noteResizeEl && noteHandle && placedHost.classList.contains("canvas-placed-note")) {
      const placement = doc.notePlacements[id];
      if (placement) {
        frameResize = {
          id: event.pointerId,
          placedId: id,
          kind: "note",
          handle: noteHandle,
          start: {
            x: placement.x,
            y: placement.y,
            width: placement.width,
            height: placement.height,
          },
          sx: event.clientX,
          sy: event.clientY,
          captured: false,
          el: placedHost,
        };
        try {
          placedHost.setPointerCapture(event.pointerId);
          frameResize.captured = true;
        } catch {
          /* inactive pointer */
        }
        event.preventDefault();
        return;
      }
    }
    if (event.shiftKey && placedHost.classList.contains("canvas-placed-card")) {
      const source = issueRefLinkSourceFromTarget(target);
      if (source) {
        cardRefLink = {
          id: event.pointerId,
          source,
          el: placedHost,
          sx: event.clientX,
          sy: event.clientY,
          active: false,
          captured: false,
        };
        return;
      }
    }
    if (event.shiftKey && isCanvasActionPointId(doc, id)) {
      apLink = {
        id: event.pointerId,
        apId: id,
        el: placedHost,
        sx: event.clientX,
        sy: event.clientY,
        active: false,
        captured: false,
      };
      return;
    }
    const selection = useDocument.getState().canvasSelection;
    if (event.shiftKey) {
      /* toggle on pointerup if this stays a click */
    } else if (!selection.includes(id)) {
      useDocument.getState().setCanvasSelection([id]);
    }
    const pt = worldPoint(event.clientX, event.clientY);
    drag = {
      id: event.pointerId,
      placedId: id,
      placedEl: placedHost,
      ox: pt.x - pos.x,
      oy: pt.y - pos.y,
      sx: event.clientX,
      sy: event.clientY,
      on: false,
      captured: false,
      shiftToggle: event.shiftKey ? id : undefined,
      editTap: !event.shiftKey && isCanvasCardEditSurface(target),
      pointerTarget: target,
    };
  };
  const onPointerMove = (event: PointerEvent) => {
    if (frameResize && event.pointerId === frameResize.id) {
      const zoom = useDocument.getState().canvasViewport.zoom;
      const dw = (event.clientX - frameResize.sx) / zoom;
      const dh = (event.clientY - frameResize.sy) / zoom;
      if (frameResize.kind === "note") {
        useDocument.getState().resizeNoteFromHandle(
          frameResize.placedId,
          frameResize.handle,
          frameResize.start,
          dw,
          dh,
        );
      } else {
        useDocument.getState().resizeFrameFromHandle(
          frameResize.placedId,
          frameResize.handle,
          frameResize.start,
          dw,
          dh,
        );
      }
      event.preventDefault();
      return;
    }
    if (cardRefLink && event.pointerId === cardRefLink.id) {
      if (!cardRefLink.active && !shouldStartCanvasCardDrag(cardRefLink.sx, cardRefLink.sy, event.clientX, event.clientY)) {
        return;
      }
      if (!cardRefLink.active) {
        cardRefLink.active = true;
        beginIssueRefLinkDrag();
        cardRefLink.el.classList.add("is-issue-ref-link-dragging");
        try {
          cardRefLink.el.setPointerCapture(event.pointerId);
          cardRefLink.captured = true;
        } catch {
          /* inactive pointer */
        }
      }
      syncIssueRefLinkDragGhost(cardRefLink.source.refToken, event.clientX, event.clientY);
      syncIssueRefLinkDropHighlight(event.clientX, event.clientY);
      event.preventDefault();
      return;
    }
    if (apLink && event.pointerId === apLink.id) {
      if (!apLink.active && !shouldStartCanvasCardDrag(apLink.sx, apLink.sy, event.clientX, event.clientY)) return;
      if (!apLink.active) {
        apLink.active = true;
        beginActionPointLinkDrag();
        apLink.el.classList.add("is-ap-link-dragging");
        try {
          apLink.el.setPointerCapture(event.pointerId);
          apLink.captured = true;
        } catch {
          /* inactive pointer */
        }
      }
      syncActionPointLinkDragGhost(apLink.el, event.clientX, event.clientY);
      syncActionPointLinkDropHighlight(event.clientX, event.clientY);
      event.preventDefault();
      return;
    }
    if (pan && event.pointerId === pan.id) {
      surface.scrollLeft = pan.left - (event.clientX - pan.x);
      surface.scrollTop = pan.top - (event.clientY - pan.y);
      return;
    }
    if (frameDraw && event.pointerId === frameDraw.id) {
      if (!frameDraw.active && !shouldStartFrameDraw(frameDraw.sx, frameDraw.sy, event.clientX, event.clientY)) return;
      if (!frameDraw.active) {
        frameDraw.active = true;
        frameDrawEl.classList.add("is-visible");
        frameDrawEl.setAttribute("aria-hidden", "false");
        surface.classList.add("is-frame-draw-active");
      }
      const box = normalizeClientRect(frameDraw.sx, frameDraw.sy, event.clientX, event.clientY);
      positionMarqueeElement(frameDrawEl, box);
      event.preventDefault();
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
      scheduleMarqueeSelection(box);
      event.preventDefault();
      return;
    }
    if (!drag || event.pointerId !== drag.id) return;
    const docForDrag = useDocument.getState();
    if (event.shiftKey && isCanvasActionPointId(docForDrag, drag.placedId)) {
      beginApLinkFromCanvasDrag(event, drag);
      event.preventDefault();
      return;
    }
    if (event.shiftKey && isCanvasCardPlacementId(docForDrag, drag.placedId)) {
      const source =
        issueRefLinkSourceFromTarget(drag.pointerTarget ?? null)
        ?? issueRefLinkSourceFromPlacedCard(drag.placedEl, docForDrag.items);
      if (source) {
        beginCardRefLinkFromCanvasDrag(event, drag, source);
        event.preventDefault();
        return;
      }
    }
    if (!drag.on && !shouldStartCanvasCardDrag(drag.sx, drag.sy, event.clientX, event.clientY)) return;
    if (!drag.on) {
      drag.on = true;
      if (document.activeElement instanceof HTMLElement && surface.contains(document.activeElement)) {
        document.activeElement.blur();
      }
      const state = useDocument.getState();
      const seedGroup = resolveCanvasDragGroup(state.canvasSelection, drag.placedId);
      drag.groupStart = {};
      for (const gid of seedGroup) {
        const p = canvasWorldPlacement(state, gid);
        if (p) drag.groupStart[gid] = { x: p.x, y: p.y };
      }
      drag.groupIds = expandCanvasDragGroupWithFrameContents(state, seedGroup, drag.groupStart);
      drag.anchorStart = { ...canvasWorldPlacement(state, drag.placedId)! };
      for (const gid of drag.groupIds) {
        if (isCanvasActionPointId(state, gid)) state.bringActionPointToFront(gid);
        else if (isCanvasFrameId(state, gid)) state.bringFrameToFront(gid);
        else if (isCanvasNoteId(state, gid)) state.bringNoteToFront(gid);
        else state.bringToFront(gid);
      }
      setGroupDraggingClass(drag.groupIds, true);
      document.body.classList.add("canvas-card-drag-active");
      try {
        drag.placedEl.setPointerCapture(event.pointerId);
        drag.captured = true;
      } catch {
        /* inactive pointer */
      }
      if (event.altKey) maybeBeginAltDuplicateCanvasDrag(event);
    }
    if (drag.on && event.altKey) maybeBeginAltDuplicateCanvasDrag(event);
    else if (drag.on && drag.altDuplicate && !event.shiftKey) maybeCancelAltDuplicateCanvasDrag(event);
    const current = drag;
    if (current.suppressGroupMoveOnce) {
      current.suppressGroupMoveOnce = false;
      event.preventDefault();
      return;
    }
    const pt = worldPoint(event.clientX, event.clientY);
    const anchorNext = clampPlacement(pt.x - current.ox, pt.y - current.oy);
    const groupIds = current.groupIds ?? [current.placedId];
    const anchorStart = current.anchorStart ?? anchorNext;
    applyCanvasDragTransform(
      surface,
      groupIds,
      current.groupStart ?? {},
      anchorStart,
      anchorNext,
    );
    event.preventDefault();
  };
  const onPointerUp = (event: PointerEvent) => {
    if (frameResize && event.pointerId === frameResize.id) {
      if (frameResize.captured) {
        try {
          frameResize.el.releasePointerCapture(frameResize.id);
        } catch {
          /* pointer already released */
        }
      }
      frameResize = null;
    }
    if (cardRefLink && event.pointerId === cardRefLink.id) {
      if (cardRefLink.active) finishIssueRefLinkDrop(cardRefLink.source, event.clientX, event.clientY);
      if (cardRefLink.captured) {
        try {
          cardRefLink.el.releasePointerCapture(cardRefLink.id);
        } catch {
          /* pointer already released */
        }
      }
      cardRefLink.el.classList.remove("is-issue-ref-link-dragging");
      endIssueRefLinkDrag();
      cardRefLink = null;
    }
    if (apLink && event.pointerId === apLink.id) {
      if (apLink.active) finishActionPointLinkDrop(apLink.apId, event.clientX, event.clientY);
      if (apLink.captured) {
        try {
          apLink.el.releasePointerCapture(apLink.id);
        } catch {
          /* pointer already released */
        }
      }
      apLink.el.classList.remove("is-ap-link-dragging");
      endActionPointLinkDrag();
      apLink = null;
    }
    if (pan && event.pointerId === pan.id) {
      const currentViewport = useDocument.getState().canvasViewport;
      useDocument.getState().setViewport({
        ...currentViewport,
        scrollLeft: surface.scrollLeft,
        scrollTop: surface.scrollTop,
      });
      pan = null;
      surface.classList.remove("is-panning");
    }
    if (frameDraw && event.pointerId === frameDraw.id) {
      if (frameDraw.active) {
        const zoom = useDocument.getState().canvasViewport.zoom;
        const rect = frameRectFromClientDrag(
          surface,
          frameDraw.sx,
          frameDraw.sy,
          event.clientX,
          event.clientY,
          zoom,
        );
        if (frameDrawMeetsMinimum(rect)) {
          useDocument.getState().createFrameWithBoundsOnCanvas(clampFrameDrawRect(rect));
          useDocument.getState().setCanvasTool("default");
        }
      }
      clearFrameDraw();
    }
    if (marquee && event.pointerId === marquee.id) {
      if (!marquee.active && !marquee.additive) useDocument.getState().clearCanvasSelection();
      clearMarquee();
    }
    if (drag && event.pointerId === drag.id) {
      if (!drag.on && drag.shiftToggle) {
        useDocument.getState().toggleCanvasSelection(drag.shiftToggle);
      } else if (!drag.on && drag.editTap) {
        event.preventDefault();
        event.stopPropagation();
        const doc = useDocument.getState();
        if (isCanvasFrameId(doc, drag.placedId)) {
          doc.beginEdit({ id: drag.placedId, field: "frameTitle", step: 0, surface: "canvas" });
        } else {
          tryBeginCanvasEditFromPointer(drag.pointerTarget ?? null);
        }
      }
      if (drag.on) {
        const groupIds = drag.groupIds ?? [drag.placedId];
        const pt = worldPoint(event.clientX, event.clientY);
        const anchorNext = clampPlacement(pt.x - drag.ox, pt.y - drag.oy);
        const anchorStart = drag.anchorStart ?? anchorNext;
        const moves = movesForCanvasGroupDrag(
          groupIds,
          drag.groupStart ?? {},
          anchorStart,
          anchorNext,
        );
        commitCanvasGroupMoves(useDocument.getState(), moves);
        clearCanvasDragTransform(surface, groupIds);
        flush(useDocument.getState);
        suppressUntil = Date.now() + 350;
        noteListCardDragEnded();
      }
      releaseDragCapture();
      setGroupDraggingClass(drag.groupIds ?? [drag.placedId], false);
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
    const scroll = scrollForZoomAtPoint(worldX, worldY, mx, my, zoom);
    useDocument.getState().setViewport({
      zoom,
      scrollLeft: Math.max(0, scroll.scrollLeft),
      scrollTop: Math.max(0, scroll.scrollTop),
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

  const spawnNoteShortcut = (event: KeyboardEvent): boolean => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return false;
    if (typingInField() || !hotspot.over || useDocument.getState().viewMode !== "list") return false;
    event.preventDefault();
    const pt = worldPoint(hotspot.x, hotspot.y);
    useDocument.getState().createNoteOnCanvas(pt.x - 120, pt.y - 90);
    return true;
  };

  const spawnCardShortcut = (event: KeyboardEvent, intent: ComposerIntent): boolean => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return false;
    if (typingInField() || !hotspot.over || useDocument.getState().viewMode !== "list") return false;
    event.preventDefault();
    const id = useDocument.getState().createBlankCard("canvas", intent);
    if (!id) return true;
    const pt = worldPoint(hotspot.x, hotspot.y);
    useDocument.getState().placeNewCardAtWorld(id, pt.x - CARD_WIDTH / 2, pt.y - DROP_OFFSET_Y);
    return true;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const typing = typingInField();
    if (event.key === "q" || event.key === "Q") {
      if (spawnCardShortcut(event, "question")) return;
    }
    if (event.key === "d" || event.key === "D") {
      if (spawnCardShortcut(event, "decision")) return;
    }
    if (event.key === "n" || event.key === "N") {
      if (spawnNoteShortcut(event)) return;
    }
    if ((event.key === "f" || event.key === "F") && !event.repeat && !event.metaKey && !event.ctrlKey && !event.altKey) {
      if (typing || !hotspot.over || useDocument.getState().viewMode !== "list") return;
      event.preventDefault();
      useDocument.getState().toggleFrameTool();
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
      if (useDocument.getState().tagFramePlacementTag) {
        useDocument.getState().cancelTagFramePlacement();
        event.preventDefault();
        return;
      }
      if (frameDraw) {
        clearFrameDraw();
        event.preventDefault();
        return;
      }
      if (useDocument.getState().canvasTool === "frame") {
        useDocument.getState().setCanvasTool("default");
        event.preventDefault();
        return;
      }
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
    if (isSpaceKey(event)) {
      clearSpacePan();
      return;
    }
    if (event.key === "Alt" && drag?.on && drag.altDuplicate && !event.shiftKey) {
      maybeCancelAltDuplicateCanvasDrag({ pointerId: drag.id });
    }
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
    if (Date.now() < suppressUntil && canvasPlacedHostFromTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const onSelectStart = (event: Event) => {
    if (marquee || frameDraw) event.preventDefault();
  };
  surface.addEventListener("pointerdown", onPointerDown);
  surface.addEventListener("selectstart", onSelectStart);
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
    surface.removeEventListener("selectstart", onSelectStart);
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
    clearFrameDraw();
    marqueeEl.remove();
    frameDrawEl.remove();
    document.body.classList.remove("canvas-space-pan");
  };
}
