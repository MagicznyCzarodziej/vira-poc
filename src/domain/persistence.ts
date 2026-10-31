import { clampAllPlacements, clampZoom, ensureAllPlacementOrders } from "./canvas.ts";
import { STORAGE_KEY, STORAGE_VERSION } from "./constants.ts";
import { recomputeNextId } from "./cards.ts";
import { normalizeStep } from "./steps.ts";
import { normalizeTagsList } from "./tags.ts";
import type { Card, Placement, SavedDocument, Viewport, ViewMode } from "./types.ts";

function isViewMode(value: unknown): value is ViewMode {
  return value === "board" || value === "list";
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
  const canvasPlacements: Record<string, Placement> = {};
  for (const [id, placement] of Object.entries(data.canvasPlacements ?? {})) {
    if (!placement || items[id]?.archivedAt) continue;
    canvasPlacements[id] = {
      x: Number(placement.x) || 0,
      y: Number(placement.y) || 0,
      order: placement.order,
    };
  }
  clampAllPlacements(canvasPlacements);
  ensureAllPlacementOrders(canvasPlacements, items);
  return {
    version: 1,
    nextId: recomputeNextId(items),
    items,
    viewMode: isViewMode(data.viewMode) ? data.viewMode : "list",
    showAllDates: data.showAllDates === true,
    listFilterNotOnCanvas: data.listFilterNotOnCanvas === true,
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
