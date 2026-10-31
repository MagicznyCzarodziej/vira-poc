import { create } from "zustand";
import { createCanvasSlice } from "./canvasSlice.ts";
import { createCardSlice } from "./cardSlice.ts";
import { createDocumentUiSlice } from "./documentUiSlice.ts";
import { flush, loadInitial, persist } from "./documentPersistence.ts";
import type { DocumentState } from "./documentTypes.ts";
import { createEditSlice } from "./editSlice.ts";

export type { EditField, EditTarget, Surface } from "./documentTypes.ts";

const loaded = loadInitial();
persist(loaded);

export const useDocument = create<DocumentState>()((set, get, store) => ({
  ...loaded,
  openComposer: false,
  composerTags: [],
  followupDrafts: {},
  editing: null,
  editInitial: "",
  focusNonce: 0,
  revealId: null,
  ...createEditSlice(set, get, store),
  ...createCardSlice(set, get, store),
  ...createDocumentUiSlice(set, get, store),
  ...createCanvasSlice(set, get, store),
}));

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => flush(useDocument.getState));
}
