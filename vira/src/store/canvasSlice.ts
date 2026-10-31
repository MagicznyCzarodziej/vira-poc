import type { StateCreator } from "zustand";
import { placeAtWorld } from "../domain/index.ts";
import type { DocumentState } from "./documentTypes.ts";
import { bagOf, schedule } from "./documentPersistence.ts";

type CanvasSlice = Pick<
  DocumentState,
  | "setView"
  | "toggleDates"
  | "setListFilter"
  | "removeFromCanvas"
  | "placeAtWorld"
  | "bringToFront"
  | "movePlacement"
  | "setViewport"
  | "clearReveal"
>;

export const createCanvasSlice: StateCreator<DocumentState, [], [], CanvasSlice> = (set, get) => ({
  setView: (viewMode) => {
    set({ viewMode });
    schedule(get);
  },
  toggleDates: () => {
    set({ showAllDates: !get().showAllDates });
    schedule(get);
  },
  setListFilter: (listFilterNotOnCanvas) => {
    set({ listFilterNotOnCanvas });
    schedule(get);
  },
  removeFromCanvas: (id) => {
    const canvasPlacements = { ...get().canvasPlacements };
    delete canvasPlacements[id];
    set({ canvasPlacements });
    schedule(get);
  },
  placeAtWorld: (id, x, y) => {
    const bag = bagOf(get());
    bag.canvasPlacements = { ...bag.canvasPlacements };
    placeAtWorld(bag, id, x, y);
    set({ canvasPlacements: bag.canvasPlacements, revealId: id });
    schedule(get);
  },
  bringToFront: (id) => {
    const bag = bagOf(get());
    bag.canvasPlacements = structuredClone(bag.canvasPlacements);
    placeAtWorld(bag, id, bag.canvasPlacements[id]?.x ?? 0, bag.canvasPlacements[id]?.y ?? 0);
    set({ canvasPlacements: bag.canvasPlacements });
    schedule(get);
  },
  movePlacement: (id, x, y) => {
    const bag = bagOf(get());
    bag.canvasPlacements = structuredClone(bag.canvasPlacements);
    placeAtWorld(bag, id, x, y);
    set({ canvasPlacements: bag.canvasPlacements });
    schedule(get);
  },
  setViewport: (canvasViewport, userSet = true) => {
    set({
      canvasViewport,
      canvasViewportUserSet: userSet ? true : get().canvasViewportUserSet,
    });
    schedule(get);
  },
  clearReveal: () => set({ revealId: null }),
});
