import { create } from "zustand";
import { createCanvasSlice } from "./canvasSlice.ts";
import { createCardSlice } from "./cardSlice.ts";
import { createDocumentUiSlice } from "./documentUiSlice.ts";
import { flush, loadInitial, persist } from "./documentPersistence.ts";
import type { DocumentState } from "./documentTypes.ts";
import { createActionPointSlice } from "./actionPointSlice.ts";
import { createFrameSlice } from "./frameSlice.ts";
import { createEditSlice } from "./editSlice.ts";

export type { EditField, EditTarget, Surface } from "./documentTypes.ts";

const loaded = loadInitial();
persist(loaded);

export const useDocument = create<DocumentState>()((set, get, store) => ({
  ...loaded,
  openComposer: false,
  composerIntent: "decision",
  composerTags: [],
  followupDrafts: {},
  editing: null,
  editInitial: "",
  focusNonce: 0,
  revealId: null,
  canvasSelection: [],
  canvasTool: "default",
  ...createEditSlice(set, get, store),
  ...createActionPointSlice(set, get, store),
  ...createFrameSlice(set, get, store),
  ...createCardSlice(set, get, store),
  ...createDocumentUiSlice(set, get, store),
  ...createCanvasSlice(set, get, store),
}));

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => flush(useDocument.getState));
}
