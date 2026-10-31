import { generateKeyBetween } from "../lib/fractional-indexing.js";
import { CARD_WIDTH, WORLD_H, WORLD_W, ZOOM_MAX, ZOOM_MIN } from "./constants.ts";
import type { Card, Placement } from "./types.ts";

export function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

export function clampPlacement(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(8, Math.min(Math.round(x), WORLD_W - CARD_WIDTH - 8)),
    y: Math.max(8, Math.min(Math.round(y), WORLD_H - 120)),
  };
}

export function orderKeyBetween(a: string | null, b: string | null): string {
  try {
    return generateKeyBetween(a, b);
  } catch {
    if (a == null && b == null) return "a0";
    if (b == null) return `${a || "a0"}U`;
    if (a == null) return `Z${b}`;
    return `${a}U`;
  }
}

export function sortedPlacementIds(
  placements: Record<string, Placement>,
  items: Record<string, Card>,
): string[] {
  return Object.keys(placements)
    .filter((id) => items[id])
    .sort((a, b) => {
      const oa = placements[a]?.order || "";
      const ob = placements[b]?.order || "";
      if (oa < ob) return -1;
      if (oa > ob) return 1;
      return a.localeCompare(b);
    });
}

export function ensurePlacementOrder(
  placements: Record<string, Placement>,
  items: Record<string, Card>,
  id: string,
): void {
  const placement = placements[id];
  if (!placement || placement.order) return;
  const sorted = sortedPlacementIds(placements, items).filter((key) => key !== id && placements[key]?.order);
  const back = sorted.length ? placements[sorted[sorted.length - 1] ?? ""]?.order ?? null : null;
  placement.order = orderKeyBetween(back, null);
}

export function ensureAllPlacementOrders(
  placements: Record<string, Placement>,
  items: Record<string, Card>,
): void {
  for (const id of Object.keys(placements)) {
    if (items[id]) ensurePlacementOrder(placements, items, id);
  }
}

export function assignOrderAtFront(
  placements: Record<string, Placement>,
  items: Record<string, Card>,
  id: string,
): void {
  if (!placements[id]) return;
  const sorted = sortedPlacementIds(placements, items);
  if (sorted[sorted.length - 1] === id) return;
  const sortedWithout = sorted.filter((key) => key !== id);
  const backKey = sortedWithout.length
    ? placements[sortedWithout[sortedWithout.length - 1] ?? ""]?.order ?? null
    : null;
  const placement = placements[id];
  if (placement) placement.order = orderKeyBetween(backKey, null);
}

export function clampAllPlacements(placements: Record<string, Placement>): void {
  for (const placement of Object.values(placements)) {
    const next = clampPlacement(placement.x, placement.y);
    placement.x = next.x;
    placement.y = next.y;
  }
}
