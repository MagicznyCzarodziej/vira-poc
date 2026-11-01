import { memo, useMemo } from "react";
import {
  sortedActionPointPlacementIds,
  sortedCardPlacementKeys,
  sortedFramePlacementIdsForPaint,
  sortedNotePlacementIds,
} from "../../domain/index.ts";
import { frameOccludersLocalById } from "../../domain/frameOccludersMap.ts";
import { useDocument } from "../../store/index.ts";
import { ActionPointView } from "../action/ActionPointView.tsx";
import { CardView } from "../CardView.tsx";
import { FrameView } from "../frame/FrameView.tsx";
import { NoteView } from "../note/NoteView.tsx";

function placementHostClass(base: string, id: string, selected: boolean, revealId: string | null): string {
  let c = base;
  if (revealId === id) c += " is-canvas-reveal-pop";
  if (selected) c += " is-canvas-selected";
  return c;
}

type LayerProps = {
  selectedSet: ReadonlySet<string>;
  revealId: string | null;
  cardZBase: number;
  apZBase: number;
  noteZBase: number;
};

export const CanvasPlacedFrames = memo(function CanvasPlacedFrames({
  selectedSet,
  revealId,
}: Pick<LayerProps, "selectedSet" | "revealId">) {
  const frames = useDocument((s) => s.frames);
  const framePlacements = useDocument((s) => s.framePlacements);
  const frameIds = useMemo(
    () => sortedFramePlacementIdsForPaint(framePlacements, frames).filter((id) => frames[id]),
    [framePlacements, frames],
  );
  const occludersById = useMemo(
    () => frameOccludersLocalById(frameIds, framePlacements),
    [frameIds, framePlacements],
  );

  return (
    <>
      {frameIds.map((id, index) => {
        const frame = frames[id];
        const pos = framePlacements[id];
        if (!frame || !pos) return null;
        const className = placementHostClass("canvas-placed-frame", id, selectedSet.has(id), revealId);
        return (
          <div
            key={id}
            className={className}
            data-canvas-placed={id}
            style={{ left: pos.x, top: pos.y, width: pos.width, height: pos.height, zIndex: index + 1 }}
            onAnimationEnd={() => useDocument.getState().clearReveal()}
          >
            <FrameView
              frame={frame}
              width={pos.width}
              height={pos.height}
              surface="canvas"
              occludersLocal={occludersById.get(id) ?? []}
            />
          </div>
        );
      })}
    </>
  );
});

export const CanvasPlacedActionPoints = memo(function CanvasPlacedActionPoints({
  selectedSet,
  revealId,
  apZBase,
}: Pick<LayerProps, "selectedSet" | "revealId" | "apZBase">) {
  const actionPoints = useDocument((s) => s.actionPoints);
  const apPlacements = useDocument((s) => s.actionPointPlacements);
  const apIds = useMemo(
    () => sortedActionPointPlacementIds(apPlacements, actionPoints).filter((id) => actionPoints[id]),
    [apPlacements, actionPoints],
  );

  return (
    <>
      {apIds.map((id, index) => {
        const ap = actionPoints[id];
        const pos = apPlacements[id];
        if (!ap || !pos) return null;
        const className = placementHostClass("canvas-placed-action-point", id, selectedSet.has(id), revealId);
        return (
          <div
            key={id}
            className={className}
            data-canvas-placed={id}
            style={{ left: pos.x, top: pos.y, zIndex: apZBase + index }}
            onAnimationEnd={() => useDocument.getState().clearReveal()}
          >
            <ActionPointView actionPoint={ap} surface="canvas" />
          </div>
        );
      })}
    </>
  );
});

export const CanvasPlacedNotes = memo(function CanvasPlacedNotes({
  selectedSet,
  revealId,
  noteZBase,
}: Pick<LayerProps, "selectedSet" | "revealId" | "noteZBase">) {
  const notes = useDocument((s) => s.notes);
  const notePlacements = useDocument((s) => s.notePlacements);
  const noteIds = useMemo(
    () => sortedNotePlacementIds(notePlacements, notes).filter((id) => notes[id]),
    [notePlacements, notes],
  );

  return (
    <>
      {noteIds.map((id, index) => {
        const note = notes[id];
        const pos = notePlacements[id];
        if (!note || !pos) return null;
        const className = placementHostClass("canvas-placed-note", id, selectedSet.has(id), revealId);
        return (
          <div
            key={id}
            className={className}
            data-canvas-placed={id}
            style={{
              left: pos.x,
              top: pos.y,
              width: pos.width,
              height: pos.height,
              zIndex: noteZBase + index,
            }}
            onAnimationEnd={() => useDocument.getState().clearReveal()}
          >
            <NoteView note={note} width={pos.width} height={pos.height} surface="canvas" />
          </div>
        );
      })}
    </>
  );
});

export const CanvasPlacedCards = memo(function CanvasPlacedCards({
  selectedSet,
  revealId,
  cardZBase,
}: Pick<LayerProps, "selectedSet" | "revealId" | "cardZBase">) {
  const items = useDocument((s) => s.items);
  const placements = useDocument((s) => s.canvasPlacements);
  const ids = useMemo(
    () => sortedCardPlacementKeys(placements, items),
    [placements, items],
  );

  return (
    <>
      {ids.map((placementKey, index) => {
        const pos = placements[placementKey];
        const itemId = pos?.itemId ?? placementKey;
        const item = items[itemId];
        if (!item || !pos) return null;
        const className = placementHostClass("canvas-placed-card", placementKey, selectedSet.has(placementKey), revealId);
        return (
          <div
            key={placementKey}
            className={className}
            data-canvas-placed={placementKey}
            data-canvas-item-id={itemId}
            style={{ left: pos.x, top: pos.y, zIndex: cardZBase + index }}
            onAnimationEnd={() => useDocument.getState().clearReveal()}
          >
            <CardView item={item} surface="canvas" canvasPlacementKey={placementKey} />
          </div>
        );
      })}
    </>
  );
});

export function useCanvasPlacementCounts() {
  const items = useDocument((s) => s.items);
  const placements = useDocument((s) => s.canvasPlacements);
  const actionPoints = useDocument((s) => s.actionPoints);
  const apPlacements = useDocument((s) => s.actionPointPlacements);
  const frames = useDocument((s) => s.frames);
  const framePlacements = useDocument((s) => s.framePlacements);
  const notes = useDocument((s) => s.notes);
  const notePlacements = useDocument((s) => s.notePlacements);

  const ids = sortedCardPlacementKeys(placements, items);
  const apIds = sortedActionPointPlacementIds(apPlacements, actionPoints).filter((id) => actionPoints[id]);
  const frameIds = sortedFramePlacementIdsForPaint(framePlacements, frames).filter((id) => frames[id]);
  const noteIds = sortedNotePlacementIds(notePlacements, notes).filter((id) => notes[id]);
  const cardZBase = frameIds.length + 1;
  const apZBase = cardZBase + ids.length;
  const noteZBase = apZBase + apIds.length;
  return { ids, apIds, frameIds, noteIds, cardZBase, apZBase, noteZBase };
}
