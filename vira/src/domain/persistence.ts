import {
  ensureAllCardPlacementOrders,
  recomputeNextCanvasPlacementId,
} from "./cardCanvasPlacements.ts";
import { clampAllPlacements, clampZoom } from "./canvas.ts";
import { STORAGE_KEY, STORAGE_VERSION } from "./constants.ts";
import { recomputeNextActionPointId } from "./actionPoints.ts";
import { recomputeNextId } from "./cards.ts";
import { normalizeStep } from "./steps.ts";
import { normalizeTagsList } from "./tags.ts";
import { normalizeAccordionCollapsed } from "./accordionCollapse.ts";
import { clampFramePlacement } from "./frameCanvas.ts";
import { applyInferredFrameParent } from "./frameNesting.ts";
import { recomputeNextFrameId } from "./frames.ts";
import { clampNotePlacement } from "./noteCanvas.ts";
import { normalizeNoteColor, recomputeNextNoteId } from "./notes.ts";
import type {
  ActionPoint,
  Card,
  CardCanvasPlacement,
  Frame,
  FramePlacement,
  Note,
  NotePlacement,
  Placement,
  SavedDocument,
  Viewport,
  ViewMode,
} from "./types.ts";

function isViewMode(value: unknown): value is ViewMode {
  return value === "board" || value === "list";
}

function normalizeEntityPlacements(
  raw: Record<string, Placement>,
  entities: Record<string, unknown>,
): Record<string, Placement> {
  const out: Record<string, Placement> = {};
  for (const [id, placement] of Object.entries(raw)) {
    if (!placement || !entities[id]) continue;
    out[id] = {
      x: Number(placement.x) || 0,
      y: Number(placement.y) || 0,
      order: placement.order,
    };
  }
  clampAllPlacements(out);
  return out;
}

function normalizeFramePlacements(
  raw: Record<string, FramePlacement>,
  frames: Record<string, Frame>,
): Record<string, FramePlacement> {
  const out: Record<string, FramePlacement> = {};
  for (const [id, placement] of Object.entries(raw)) {
    if (!placement || !frames[id]) continue;
    const clamped = clampFramePlacement(
      Number(placement.x) || 0,
      Number(placement.y) || 0,
      Number(placement.width) || 520,
      Number(placement.height) || 360,
    );
    const parentFrameId =
      typeof placement.parentFrameId === "string" && frames[placement.parentFrameId]
        ? placement.parentFrameId
        : null;
    out[id] = { ...clamped, order: placement.order, parentFrameId };
  }
  for (const id of Object.keys(out)) {
    applyInferredFrameParent(out, frames, id);
  }
  return out;
}

function normalizeNotePlacements(
  raw: Record<string, NotePlacement>,
  notes: Record<string, Note>,
): Record<string, NotePlacement> {
  const out: Record<string, NotePlacement> = {};
  for (const [id, placement] of Object.entries(raw)) {
    if (!placement || !notes[id]) continue;
    const clamped = clampNotePlacement(
      Number(placement.x) || 0,
      Number(placement.y) || 0,
      Number(placement.width) || 240,
      Number(placement.height) || 180,
    );
    out[id] = { ...clamped, order: placement.order };
  }
  return out;
}

function normalizeViewport(raw: unknown): Viewport {
  const value = raw && typeof raw === "object" ? raw as Partial<Viewport> : {};
  return {
    scrollLeft: Math.max(0, Number(value.scrollLeft) || 0),
    scrollTop: Math.max(0, Number(value.scrollTop) || 0),
    zoom: clampZoom(Number(value.zoom) || 1),
  };
}

export function normalizeDocument(data: SavedDocument): SavedDocument {
  const items: Record<string, Card> = {};
  for (const [id, item] of Object.entries(data.items)) {
    if (!item || typeof item !== "object" || !Array.isArray(item.steps)) continue;
    items[id] = {
      id: item.id || id,
      tags: normalizeTagsList(item.tags),
      archivedAt: item.archivedAt || null,
      steps: item.steps.map((step) => normalizeStep(step)),
    };
  }
  const canvasPlacements: Record<string, CardCanvasPlacement> = {};
  for (const [key, placement] of Object.entries(data.canvasPlacements ?? {})) {
    if (!placement || typeof placement !== "object") continue;
    const raw = placement as CardCanvasPlacement;
    const itemId = typeof raw.itemId === "string" && items[raw.itemId] ? raw.itemId : items[key] ? key : null;
    if (!itemId || items[itemId]?.archivedAt) continue;
    canvasPlacements[key] = {
      x: Number(raw.x) || 0,
      y: Number(raw.y) || 0,
      order: raw.order,
      itemId,
    };
  }
  clampAllPlacements(canvasPlacements);
  ensureAllCardPlacementOrders(canvasPlacements, items);
  const actionPoints: Record<string, ActionPoint> = {};
  for (const [id, raw] of Object.entries(data.actionPoints ?? {})) {
    if (!raw || typeof raw !== "object") continue;
    const title = typeof raw.title === "string" ? raw.title : "Action";
    actionPoints[id] = {
      id: raw.id || id,
      title,
      done: raw.done === true,
      doneAt: raw.doneAt || null,
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
    };
  }
  const frames: Record<string, Frame> = {};
  for (const [id, raw] of Object.entries(data.frames ?? {})) {
    if (!raw || typeof raw !== "object") continue;
    frames[id] = {
      id: raw.id || id,
      title: typeof raw.title === "string" ? raw.title : "Frame",
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
    };
  }
  const framePlacements = normalizeFramePlacements(data.framePlacements ?? {}, frames);
  const notes: Record<string, Note> = {};
  for (const [id, raw] of Object.entries(data.notes ?? {})) {
    if (!raw || typeof raw !== "object") continue;
    notes[id] = {
      id: raw.id || id,
      body: typeof raw.body === "string" ? raw.body : "",
      color: normalizeNoteColor(raw.color),
      createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
    };
  }
  const notePlacements = normalizeNotePlacements(data.notePlacements ?? {}, notes);
  return {
    version: 1,
    nextId: recomputeNextId(items),
    nextActionPointId: Math.max(recomputeNextActionPointId(actionPoints), Number(data.nextActionPointId) || 1),
    items,
    actionPoints,
    actionPointPlacements: normalizeEntityPlacements(data.actionPointPlacements ?? {}, actionPoints),
    nextFrameId: Math.max(recomputeNextFrameId(frames), Number(data.nextFrameId) || 1),
    frames,
    framePlacements,
    nextNoteId: Math.max(recomputeNextNoteId(notes), Number(data.nextNoteId) || 1),
    notes,
    notePlacements,
    viewMode: isViewMode(data.viewMode) ? data.viewMode : "list",
    showAllDates: data.showAllDates === true,
    listFilterNotOnCanvas: data.listFilterNotOnCanvas === true,
    listFilterTag: typeof data.listFilterTag === "string" && data.listFilterTag.trim()
      ? data.listFilterTag.trim().toLowerCase()
      : null,
    sidebarHidden: data.sidebarHidden === true,
    accordionCollapsed: normalizeAccordionCollapsed(data.accordionCollapsed),
    nextCanvasPlacementId: Math.max(
      recomputeNextCanvasPlacementId(canvasPlacements),
      Number(data.nextCanvasPlacementId) || 1,
    ),
    canvasPlacements,
    canvasViewport: normalizeViewport(data.canvasViewport),
    canvasViewportUserSet: data.canvasViewportUserSet === true,
  };
}

export function loadDocument(storage: Pick<Storage, "getItem"> = localStorage): SavedDocument | null {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SavedDocument> | null;
    if (!data || data.version !== STORAGE_VERSION || !data.items || typeof data.items !== "object") return null;
    return normalizeDocument(data as SavedDocument);
  } catch (error) {
    console.warn("Could not load Vira document", error);
    return null;
  }
}

export function saveDocument(doc: SavedDocument, storage: Pick<Storage, "setItem"> = localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...doc, version: STORAGE_VERSION }));
  } catch (error) {
    console.warn("Could not save Vira document", error);
  }
}
