import type { StateCreator } from "zustand";
import { placeAtWorld } from "../domain/index.ts";
import type { DocumentState } from "./documentTypes.ts";
import { bagOf, schedule } from "./documentPersistence.ts";

type CanvasSlice = Pick<
  DocumentState,
  | "removeFromCanvas"
  | "placeAtWorld"
  | "bringToFront"
  | "movePlacement"
  | "movePlacements"
  | "setCanvasSelection"
  | "toggleCanvasSelection"
  | "clearCanvasSelection"
  | "removeCanvasSelectionFromCanvas"
  | "setViewport"
>;

export const createCanvasSlice: StateCreator<DocumentState, [], [], CanvasSlice> = (set, get) => ({
  removeFromCanvas: (id) => {
    const canvasPlacements = { ...get().canvasPlacements };
    delete canvasPlacements[id];
    set({
      canvasPlacements,
      canvasSelection: get().canvasSelection.filter((selected) => selected !== id),
    });
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
  movePlacements: (moves) => {
    if (moves.length === 0) return;
    const bag = bagOf(get());
    bag.canvasPlacements = structuredClone(bag.canvasPlacements);
    for (const { id, x, y } of moves) {
      placeAtWorld(bag, id, x, y);
    }
    set({ canvasPlacements: bag.canvasPlacements });
    schedule(get);
  },
  setCanvasSelection: (canvasSelection) => set({ canvasSelection }),
  toggleCanvasSelection: (id) => {
    const current = get().canvasSelection;
    set({
      canvasSelection: current.includes(id)
        ? current.filter((selected) => selected !== id)
        : [...current, id],
    });
  },
  clearCanvasSelection: () => set({ canvasSelection: [] }),
  removeCanvasSelectionFromCanvas: () => {
    const ids = get().canvasSelection;
    if (ids.length === 0) return;
    const canvasPlacements = { ...get().canvasPlacements };
    const actionPointPlacements = { ...get().actionPointPlacements };
    for (const id of ids) {
      if (get().actionPoints[id]) delete actionPointPlacements[id];
      else delete canvasPlacements[id];
    }
    set({ canvasPlacements, actionPointPlacements, canvasSelection: [] });
    schedule(get);
  },
  setViewport: (canvasViewport, userSet = true) => {
    set({
      canvasViewport,
      canvasViewportUserSet: userSet ? true : get().canvasViewportUserSet,
    });
    schedule(get);
  },
});
