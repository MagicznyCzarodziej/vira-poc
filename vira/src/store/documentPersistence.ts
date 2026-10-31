import {
  createDocumentFromSeed,
  loadDocument,
  saveDocument,
  type DocBag,
  type SavedDocument,
} from "../domain/index.ts";
import type { DocumentState } from "./documentTypes.ts";

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function bagOf(state: SavedDocument): DocBag {
  return {
    nextId: state.nextId,
    items: state.items,
    canvasPlacements: state.canvasPlacements,
  };
}

export function persist(state: SavedDocument) {
  saveDocument({
    version: 1,
    nextId: state.nextId,
    nextActionPointId: state.nextActionPointId,
    items: state.items,
    actionPoints: state.actionPoints,
    actionPointPlacements: state.actionPointPlacements,
    viewMode: state.viewMode,
    showAllDates: state.showAllDates,
    listFilterNotOnCanvas: state.listFilterNotOnCanvas,
    canvasPlacements: state.canvasPlacements,
    canvasViewport: state.canvasViewport,
    canvasViewportUserSet: state.canvasViewportUserSet,
  });
}

export function schedule(get: () => DocumentState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    persist(get());
  }, 250);
}

export function flush(get: () => DocumentState) {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  persist(get());
}

export function loadInitial(): SavedDocument {
  return loadDocument() ?? createDocumentFromSeed();
}
