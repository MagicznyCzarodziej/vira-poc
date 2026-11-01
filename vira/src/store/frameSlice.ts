import type { StateCreator } from "zustand";
import {
  addCardInstanceToCanvas,
  applyInferredFrameParent,
  applyInferredFrameParents,
  clearFrameParentReferences,
  reinferAllFrameParents,
  clampFramePlacement,
  createFrame,
  moveFrameAtWorld,
  placeFrameAtWorld,
  planTagFrameOnCanvas,
  removeFrameFromCanvasPlacements,
  resizeFrameRectFromDrag,
  setFrameBoundsAtWorld,
  type FrameRect,
  type FrameResizeHandle,
} from "../domain/index.ts";
import type { DocumentState } from "./documentTypes.ts";
import { bagOf, schedule } from "./documentPersistence.ts";

type FrameSlice = Pick<
  DocumentState,
  | "createFrameOnCanvas"
  | "createFrameWithBoundsOnCanvas"
  | "setFrameTitle"
  | "moveFramePlacements"
  | "resizeFrame"
  | "resizeFrameFromHandle"
  | "bringFrameToFront"
  | "removeFrameFromCanvas"
  | "createFrameForTagOnCanvas"
>;

export const createFrameSlice: StateCreator<DocumentState, [], [], FrameSlice> = (set, get) => ({
  createFrameOnCanvas: (x, y, title = "Frame") => {
    const frames = { ...get().frames };
    const framePlacements = { ...get().framePlacements };
    const bag = { nextFrameId: get().nextFrameId, frames };
    const frame = createFrame(bag, title);
    placeFrameAtWorld(framePlacements, bag.frames, frame.id, x, y);
    reinferAllFrameParents(framePlacements, bag.frames);
    set({
      frames: bag.frames,
      framePlacements,
      nextFrameId: bag.nextFrameId,
      revealId: frame.id,
      canvasSelection: [frame.id],
    });
    schedule(get);
    return frame.id;
  },
  createFrameWithBoundsOnCanvas: (bounds, title = "Frame") => {
    const next = clampFramePlacement(bounds.x, bounds.y, bounds.width, bounds.height);
    const frames = { ...get().frames };
    const framePlacements = { ...get().framePlacements };
    const bag = { nextFrameId: get().nextFrameId, frames };
    const frame = createFrame(bag, title);
    placeFrameAtWorld(framePlacements, bag.frames, frame.id, next.x, next.y, {
      width: next.width,
      height: next.height,
    });
    reinferAllFrameParents(framePlacements, bag.frames);
    set({
      frames: bag.frames,
      framePlacements,
      nextFrameId: bag.nextFrameId,
      revealId: frame.id,
      canvasSelection: [frame.id],
    });
    schedule(get);
    return frame.id;
  },
  setFrameTitle: (frameId, title) => {
    const frame = get().frames[frameId];
    if (!frame) return;
    const trimmed = title.trim() || "Frame";
    if (frame.title === trimmed) return;
    set({ frames: { ...get().frames, [frameId]: { ...frame, title: trimmed } } });
    schedule(get);
  },
  moveFramePlacements: (moves) => {
    if (moves.length === 0) return;
    const framePlacements = structuredClone(get().framePlacements);
    const frames = get().frames;
    for (const { id, x, y } of moves) {
      moveFrameAtWorld(framePlacements, frames, id, x, y);
    }
    applyInferredFrameParents(
      framePlacements,
      frames,
      moves.map((move) => move.id),
    );
    set({ framePlacements });
    schedule(get);
  },
  resizeFrame: (id, width, height) => {
    const prev = get().framePlacements[id];
    if (!prev) return;
    const framePlacements = structuredClone(get().framePlacements);
    if (!setFrameBoundsAtWorld(framePlacements, get().frames, id, {
      x: prev.x,
      y: prev.y,
      width,
      height,
    })) return;
    reinferAllFrameParents(framePlacements, get().frames);
    set({ framePlacements });
    schedule(get);
  },
  resizeFrameFromHandle: (id, handle, start, dx, dy) => {
    const framePlacements = structuredClone(get().framePlacements);
    const bounds = resizeFrameRectFromDrag(start, handle, dx, dy);
    if (!setFrameBoundsAtWorld(framePlacements, get().frames, id, bounds)) return;
    reinferAllFrameParents(framePlacements, get().frames);
    set({ framePlacements });
    schedule(get);
  },
  bringFrameToFront: (id) => {
    const framePlacements = { ...get().framePlacements };
    const frames = get().frames;
    const placement = framePlacements[id];
    if (!placement || !frames[id]) return;
    placeFrameAtWorld(framePlacements, frames, id, placement.x, placement.y, {
      width: placement.width,
      height: placement.height,
    });
    set({ framePlacements });
    schedule(get);
  },
  createFrameForTagOnCanvas: (tag, anchor) => {
    const plan = planTagFrameOnCanvas(get().items, anchor, tag);
    if (!plan) return null;

    const bag = bagOf(get());
    bag.canvasPlacements = structuredClone(bag.canvasPlacements);
    for (const add of plan.placementAdds) {
      addCardInstanceToCanvas(bag, add.itemId, add.x, add.y);
    }

    const frames = { ...get().frames };
    const framePlacements = structuredClone(get().framePlacements);
    const frameBag = { nextFrameId: get().nextFrameId, frames };
    const frame = createFrame(frameBag, plan.frameTitle);
    const bounds = plan.frameBounds;
    placeFrameAtWorld(framePlacements, frameBag.frames, frame.id, bounds.x, bounds.y, {
      width: bounds.width,
      height: bounds.height,
    });
    reinferAllFrameParents(framePlacements, frameBag.frames);

    set({
      canvasPlacements: bag.canvasPlacements,
      nextCanvasPlacementId: bag.nextCanvasPlacementId,
      frames: frameBag.frames,
      framePlacements,
      nextFrameId: frameBag.nextFrameId,
      revealId: frame.id,
      canvasSelection: [frame.id],
    });
    schedule(get);
    return frame.id;
  },
  removeFrameFromCanvas: (id) => {
    const framePlacements = { ...get().framePlacements };
    const orphaned = clearFrameParentReferences(framePlacements, id);
    removeFrameFromCanvasPlacements(framePlacements, id);
    const frames = { ...get().frames };
    delete frames[id];
    applyInferredFrameParents(framePlacements, frames, orphaned);
    set({
      frames,
      framePlacements,
      canvasSelection: get().canvasSelection.filter((selected) => selected !== id),
    });
    schedule(get);
  },
});
