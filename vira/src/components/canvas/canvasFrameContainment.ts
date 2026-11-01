import { ACTION_POINT_WIDTH, CARD_WIDTH } from "../../domain/constants.ts";
import type { DocumentState } from "../../store/documentTypes.ts";
import { cardPlacementItemId } from "../../domain/cardCanvasPlacements.ts";
import { childFrameIds } from "../../domain/index.ts";
import { isCanvasFrameId } from "./canvasPlaced.ts";

/** Rough height for hit-testing “inside frame” (matches fly-to estimate for cards). */
export const CANVAS_CARD_EST_HEIGHT = 360;
export const CANVAS_ACTION_POINT_EST_HEIGHT = 96;

export type FrameRect = { x: number; y: number; width: number; height: number };

export function pointInsideFrame(px: number, py: number, frame: FrameRect): boolean {
  return (
    px >= frame.x
    && px <= frame.x + frame.width
    && py >= frame.y
    && py <= frame.y + frame.height
  );
}

/** Distance from a point inside a frame to its nearest edge (world units). */
export function distancePointToFrameBorder(px: number, py: number, frame: FrameRect): number {
  if (!pointInsideFrame(px, py, frame)) return Number.POSITIVE_INFINITY;
  return Math.min(
    px - frame.x,
    frame.x + frame.width - px,
    py - frame.y,
    frame.y + frame.height - py,
  );
}

/** Among frames containing (px, py), pick the one whose border is closest to the cursor. */
export function pickFrameIdAtWorldPoint(
  framePlacements: Record<string, { x: number; y: number; width: number; height: number }>,
  frames: Record<string, { id: string }>,
  px: number,
  py: number,
): string | null {
  let best: { id: string; dist: number; area: number } | null = null;
  for (const [id, placement] of Object.entries(framePlacements)) {
    if (!frames[id]) continue;
    const rect: FrameRect = {
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
    };
    const dist = distancePointToFrameBorder(px, py, rect);
    if (!Number.isFinite(dist)) continue;
    const area = rect.width * rect.height;
    if (
      !best
      || dist < best.dist
      || (dist === best.dist && area < best.area)
    ) {
      best = { id, dist, area };
    }
  }
  return best?.id ?? null;
}

export function placementCenterInWorld(
  pos: { x: number; y: number },
  kind: "card" | "actionPoint" | "frame",
  frameSize?: { width: number; height: number },
): { x: number; y: number } {
  if (kind === "frame" && frameSize) {
    return { x: pos.x + frameSize.width / 2, y: pos.y + frameSize.height / 2 };
  }
  const w = kind === "card" ? CARD_WIDTH : ACTION_POINT_WIDTH;
  const h = kind === "card" ? CANVAS_CARD_EST_HEIGHT : CANVAS_ACTION_POINT_EST_HEIGHT;
  return { x: pos.x + w / 2, y: pos.y + h / 2 };
}

/** Smallest-area frame whose bounds contain (px, py). */
export function innermostFrameIdAtWorldPoint(
  framePlacements: Record<string, { x: number; y: number; width: number; height: number }>,
  frames: Record<string, { id: string }>,
  px: number,
  py: number,
): string | null {
  let best: { id: string; area: number } | null = null;
  for (const [id, placement] of Object.entries(framePlacements)) {
    if (!frames[id]) continue;
    const rect: FrameRect = {
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
    };
    if (!pointInsideFrame(px, py, rect)) continue;
    const area = rect.width * rect.height;
    if (!best || area < best.area) best = { id, area };
  }
  return best?.id ?? null;
}

/** Placements whose top-left anchor sits in this frame and not in a smaller nested frame. */
export function canvasPlacementIdsOwnedByFrameHost(
  state: Pick<
    DocumentState,
    | "canvasPlacements"
    | "items"
    | "actionPointPlacements"
    | "actionPoints"
    | "framePlacements"
    | "frames"
    | "notePlacements"
    | "notes"
  >,
  frameHostId: string,
  options: { excludeIds?: ReadonlySet<string> } = {},
): string[] {
  const exclude = options.excludeIds ?? new Set<string>();
  const out: string[] = [];

  for (const [key, placement] of Object.entries(state.canvasPlacements)) {
    if (exclude.has(key)) continue;
    const itemId = cardPlacementItemId(key, placement, state.items);
    if (!itemId) continue;
    if (innermostFrameIdAtWorldPoint(state.framePlacements, state.frames, placement.x, placement.y) === frameHostId) {
      out.push(key);
    }
  }

  for (const [id, placement] of Object.entries(state.actionPointPlacements)) {
    if (exclude.has(id)) continue;
    if (!state.actionPoints[id]) continue;
    if (innermostFrameIdAtWorldPoint(state.framePlacements, state.frames, placement.x, placement.y) === frameHostId) {
      out.push(id);
    }
  }

  for (const [id, placement] of Object.entries(state.notePlacements ?? {})) {
    if (exclude.has(id)) continue;
    if (!state.notes[id]) continue;
    if (innermostFrameIdAtWorldPoint(state.framePlacements, state.frames, placement.x, placement.y) === frameHostId) {
      out.push(id);
    }
  }

  return out;
}

export function canvasPlacementIdsInsideFrame(
  state: Pick<
    DocumentState,
    | "canvasPlacements"
    | "items"
    | "actionPointPlacements"
    | "actionPoints"
    | "framePlacements"
    | "frames"
    | "notePlacements"
    | "notes"
  >,
  frame: FrameRect,
  options: {
    excludeIds?: ReadonlySet<string>;
    frameHostId?: string;
    /** Nested frames are not auto-grouped (Figma-style: only explicit hierarchy, not center overlap). */
    includeFrames?: boolean;
  } = {},
): string[] {
  if (options.frameHostId) {
    return canvasPlacementIdsOwnedByFrameHost(state, options.frameHostId, {
      excludeIds: options.excludeIds,
    });
  }

  const exclude = options.excludeIds ?? new Set<string>();
  const out: string[] = [];

  for (const [key, placement] of Object.entries(state.canvasPlacements)) {
    if (exclude.has(key)) continue;
    const itemId = cardPlacementItemId(key, placement, state.items);
    if (!itemId) continue;
    const center = placementCenterInWorld(placement, "card");
    if (pointInsideFrame(center.x, center.y, frame)) out.push(key);
  }

  for (const [id, placement] of Object.entries(state.actionPointPlacements)) {
    if (exclude.has(id)) continue;
    if (!state.actionPoints[id]) continue;
    const center = placementCenterInWorld(placement, "actionPoint");
    if (pointInsideFrame(center.x, center.y, frame)) out.push(id);
  }

  if (options.includeFrames) {
    for (const [id, placement] of Object.entries(state.framePlacements)) {
      if (exclude.has(id) || id === options.frameHostId) continue;
      if (!state.frames[id]) continue;
      const center = placementCenterInWorld(placement, "frame", {
        width: placement.width,
        height: placement.height,
      });
      if (pointInsideFrame(center.x, center.y, frame)) out.push(id);
    }
  }

  return out;
}

/** When dragging frame(s), also drag placements whose center lies inside those frames at drag start. */
export function expandCanvasDragGroupWithFrameContents(
  state: Pick<
    DocumentState,
    | "canvasPlacements"
    | "items"
    | "actionPointPlacements"
    | "actionPoints"
    | "framePlacements"
    | "frames"
    | "notePlacements"
    | "notes"
  >,
  groupIds: readonly string[],
  groupStart: Record<string, { x: number; y: number }>,
): string[] {
  const expanded = new Set(groupIds);

  const addNestedFrames = (parentId: string) => {
    for (const childId of childFrameIds(parentId, state.framePlacements)) {
      if (expanded.has(childId)) continue;
      expanded.add(childId);
      if (!groupStart[childId]) {
        const pos = state.framePlacements[childId];
        if (pos) groupStart[childId] = { x: pos.x, y: pos.y };
      }
      addNestedFrames(childId);
    }
  };

  for (const id of groupIds) {
    if (isCanvasFrameId(state, id)) addNestedFrames(id);
  }

  const frameIdsInGroup = [...expanded].filter((id) => isCanvasFrameId(state, id));
  for (const id of frameIdsInGroup) {
    const inside = canvasPlacementIdsOwnedByFrameHost(state, id, { excludeIds: expanded });
    for (const childId of inside) {
      expanded.add(childId);
      if (!groupStart[childId]) {
        const pos = state.canvasPlacements[childId]
          ?? state.actionPointPlacements[childId]
          ?? state.notePlacements[childId]
          ?? state.framePlacements[childId];
        if (pos) groupStart[childId] = { x: pos.x, y: pos.y };
      }
    }
  }

  return [...expanded];
}
