import type { StateCreator } from "zustand";
import {
  bringCardPlacementToFront,
  duplicateCardPlacements,
  moveCardPlacementAtWorld,
  placeAtWorld,
  placeNewCardAtWorld as placeFirstCardInstanceAtWorld,
} from "../domain/index.ts";
import type { DocumentState } from "./documentTypes.ts";
import { bagOf, schedule } from "./documentPersistence.ts";

type CanvasSlice = Pick<
  DocumentState,
  | "removeFromCanvas"
  | "placeAtWorld"
  | "placeNewCardAtWorld"
  | "bringToFront"
  | "movePlacement"
  | "movePlacements"
  | "duplicateCardPlacementsForDrag"
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
    const placementKey = placeAtWorld(bag, id, x, y);
    if (!placementKey) return;
    set({
      canvasPlacements: bag.canvasPlacements,
      nextCanvasPlacementId: bag.nextCanvasPlacementId,
      revealId: placementKey,
    });
    schedule(get);
  },
  placeNewCardAtWorld: (id, x, y) => {
    const bag = bagOf(get());
    bag.canvasPlacements = { ...bag.canvasPlacements };
    const placementKey = placeFirstCardInstanceAtWorld(bag, id, x, y);
    if (!placementKey) return;
    set({
      canvasPlacements: bag.canvasPlacements,
      nextCanvasPlacementId: bag.nextCanvasPlacementId,
      revealId: placementKey,
    });
    schedule(get);
  },
  bringToFront: (id) => {
    const bag = bagOf(get());
    bag.canvasPlacements = structuredClone(bag.canvasPlacements);
    if (!bringCardPlacementToFront(bag, id)) return;
    set({ canvasPlacements: bag.canvasPlacements });
    schedule(get);
  },
  movePlacement: (id, x, y) => {
    const bag = bagOf(get());
    bag.canvasPlacements = structuredClone(bag.canvasPlacements);
    if (!moveCardPlacementAtWorld(bag, id, x, y)) return;
    set({ canvasPlacements: bag.canvasPlacements });
    schedule(get);
  },
  movePlacements: (moves) => {
    if (moves.length === 0) return;
    const bag = bagOf(get());
    bag.canvasPlacements = structuredClone(bag.canvasPlacements);
    for (const { id, x, y } of moves) {
      moveCardPlacementAtWorld(bag, id, x, y);
    }
    set({ canvasPlacements: bag.canvasPlacements });
    schedule(get);
  },
  duplicateCardPlacementsForDrag: (placementKeys, positions) => {
    if (placementKeys.length === 0) return {};
    const bag = bagOf(get());
    bag.canvasPlacements = { ...bag.canvasPlacements };
    const keyMap = duplicateCardPlacements(bag, placementKeys, (key) => positions[key] ?? null);
    const newKeys = Object.values(keyMap).filter((k, i, arr) => arr.indexOf(k) === i);
    set({
      canvasPlacements: bag.canvasPlacements,
      nextCanvasPlacementId: bag.nextCanvasPlacementId,
      revealId: newKeys[newKeys.length - 1] ?? get().revealId,
    });
    schedule(get);
    return keyMap;
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
