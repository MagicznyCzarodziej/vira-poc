import { ACTION_POINT_WIDTH, WORLD_H, WORLD_W } from "./constants.ts";
import {
  assignOrderAtFront,
  clampPlacement,
  ensurePlacementOrder,
  sortedPlacementIds,
} from "./canvas.ts";
import type { ActionPoint, Placement } from "./types.ts";

function clampActionPointPlacement(x: number, y: number): { x: number; y: number } {
  const pos = clampPlacement(x, y);
  return {
    x: Math.max(8, Math.min(pos.x, WORLD_W - ACTION_POINT_WIDTH - 8)),
    y: Math.max(8, Math.min(pos.y, WORLD_H - 96)),
  };
}

export function sortedActionPointPlacementIds(
  placements: Record<string, Placement>,
  actionPoints: Record<string, ActionPoint>,
): string[] {
  const items = Object.fromEntries(
    Object.keys(placements)
      .filter((id) => actionPoints[id])
      .map((id) => [id, { id }]),
  ) as Record<string, { id: string }>;
  return sortedPlacementIds(placements, items as never);
}

export function placeActionPointAtWorld(
  placements: Record<string, Placement>,
  actionPoints: Record<string, ActionPoint>,
  id: string,
  x: number,
  y: number,
): void {
  if (!actionPoints[id]) return;
  const pos = clampActionPointPlacement(x, y);
  placements[id] = { ...placements[id], ...pos };
  const pseudoItems = Object.fromEntries(Object.keys(actionPoints).map((key) => [key, { id: key }]));
  ensurePlacementOrder(placements, pseudoItems as never, id);
  assignOrderAtFront(placements, pseudoItems as never, id);
}

export function removeActionPointFromCanvasPlacements(
  placements: Record<string, Placement>,
  id: string,
): void {
  delete placements[id];
}

/** Newest action id first (ap-10 before ap-2). */
export function compareActionPointIdsNewestFirst(a: string, b: string): number {
  const na = Number.parseInt(a.replace(/^ap-/i, ""), 10) || 0;
  const nb = Number.parseInt(b.replace(/^ap-/i, ""), 10) || 0;
  if (na !== nb) return nb - na;
  return b.localeCompare(a);
}

export function liveActionPointIds(actionPoints: Record<string, ActionPoint>): string[] {
  return Object.keys(actionPoints).sort(compareActionPointIdsNewestFirst);
}
