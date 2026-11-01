import { clampPlacement, orderKeyBetween } from "./canvas.ts";
import type { Card, CardCanvasPlacement, DocBag } from "./types.ts";

export function cardPlacementItemId(
  placementKey: string,
  placement: CardCanvasPlacement | undefined,
  items: Record<string, Card>,
): string | null {
  if (!placement) return null;
  const itemId = placement.itemId ?? (items[placementKey] ? placementKey : null);
  if (!itemId || !items[itemId] || items[itemId].archivedAt) return null;
  return itemId;
}

export function sortedCardPlacementKeys(
  placements: Record<string, CardCanvasPlacement>,
  items: Record<string, Card>,
): string[] {
  const valid = Object.keys(placements).filter((key) => cardPlacementItemId(key, placements[key], items));
  return valid.sort((a, b) => {
    const oa = placements[a]?.order || "";
    const ob = placements[b]?.order || "";
    if (oa < ob) return -1;
    if (oa > ob) return 1;
    return a.localeCompare(b);
  });
}

export function ensureCardPlacementOrder(
  placements: Record<string, CardCanvasPlacement>,
  items: Record<string, Card>,
  key: string,
): void {
  const placement = placements[key];
  if (!placement || placement.order) return;
  const sorted = sortedCardPlacementKeys(placements, items).filter(
    (id) => id !== key && placements[id]?.order,
  );
  const back = sorted.length ? placements[sorted[sorted.length - 1] ?? ""]?.order ?? null : null;
  placement.order = orderKeyBetween(back, null);
}

export function ensureAllCardPlacementOrders(
  placements: Record<string, CardCanvasPlacement>,
  items: Record<string, Card>,
): void {
  for (const key of Object.keys(placements)) {
    if (cardPlacementItemId(key, placements[key], items)) ensureCardPlacementOrder(placements, items, key);
  }
}

export function assignCardPlacementOrderAtFront(
  placements: Record<string, CardCanvasPlacement>,
  items: Record<string, Card>,
  key: string,
): void {
  if (!placements[key]) return;
  const sorted = sortedCardPlacementKeys(placements, items);
  if (sorted[sorted.length - 1] === key) return;
  const sortedWithout = sorted.filter((id) => id !== key);
  const backKey = sortedWithout.length
    ? placements[sortedWithout[sortedWithout.length - 1] ?? ""]?.order ?? null
    : null;
  const placement = placements[key];
  if (placement) placement.order = orderKeyBetween(backKey, null);
}

export function itemHasCanvasPlacement(
  placements: Record<string, CardCanvasPlacement>,
  items: Record<string, Card>,
  itemId: string,
): boolean {
  for (const [key, placement] of Object.entries(placements)) {
    if (cardPlacementItemId(key, placement, items) === itemId) return true;
  }
  return false;
}

export function canvasPlacementKeysForItem(
  placements: Record<string, CardCanvasPlacement>,
  items: Record<string, Card>,
  itemId: string,
): string[] {
  return sortedCardPlacementKeys(placements, items).filter(
    (key) => cardPlacementItemId(key, placements[key], items) === itemId,
  );
}

/** Resolve reveal/hover id (item id or placement key) to a canvas placement key. */
export function resolveCardCanvasPlacementKey(
  placements: Record<string, CardCanvasPlacement>,
  items: Record<string, Card>,
  id: string,
): string | null {
  if (placements[id] && cardPlacementItemId(id, placements[id], items)) return id;
  if (items[id]) {
    const keys = canvasPlacementKeysForItem(placements, items, id);
    if (keys.includes(id)) return id;
    return keys[0] ?? null;
  }
  return null;
}

export function recomputeNextCanvasPlacementId(placements: Record<string, CardCanvasPlacement>): number {
  let max = 1;
  for (const key of Object.keys(placements)) {
    const match = key.match(/^canvas-(\d+)$/i);
    if (match) max = Math.max(max, parseInt(match[1] ?? "0", 10) + 1);
  }
  return max;
}

export function removeCanvasPlacementsForItem(
  placements: Record<string, CardCanvasPlacement>,
  items: Record<string, Card>,
  itemId: string,
): void {
  for (const key of Object.keys(placements)) {
    if (key === itemId || cardPlacementItemId(key, placements[key], items) === itemId) {
      delete placements[key];
    }
  }
}

type CanvasBag = DocBag & { nextCanvasPlacementId: number };

/** Clone canvas hosts at given world positions (same item, new placement keys). */
export function duplicateCardPlacements(
  bag: CanvasBag,
  placementKeys: readonly string[],
  positionForKey: (key: string) => { x: number; y: number } | null,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of placementKeys) {
    const placement = bag.canvasPlacements[key];
    const itemId = cardPlacementItemId(key, placement, bag.items);
    if (!itemId || !placement) {
      map[key] = key;
      continue;
    }
    const pos = positionForKey(key) ?? placement;
    const newKey = addCardInstanceToCanvas(bag, itemId, pos.x, pos.y);
    map[key] = newKey ?? key;
  }
  return map;
}

export function addCardInstanceToCanvas(
  bag: CanvasBag,
  itemId: string,
  x: number,
  y: number,
  options: { useItemIdAsKey?: boolean } = {},
): string | null {
  if (!bag.items[itemId] || bag.items[itemId]?.archivedAt) return null;
  const pos = clampPlacement(x, y);
  let key: string;
  if (options.useItemIdAsKey && !bag.canvasPlacements[itemId]) {
    key = itemId;
  } else {
    key = `canvas-${bag.nextCanvasPlacementId}`;
    bag.nextCanvasPlacementId += 1;
  }
  bag.canvasPlacements[key] = { ...bag.canvasPlacements[key], ...pos, itemId };
  ensureCardPlacementOrder(bag.canvasPlacements, bag.items, key);
  assignCardPlacementOrderAtFront(bag.canvasPlacements, bag.items, key);
  return key;
}

export function moveCardPlacementAtWorld(bag: DocBag, placementKey: string, x: number, y: number): boolean {
  const placement = bag.canvasPlacements[placementKey];
  if (!placement || !cardPlacementItemId(placementKey, placement, bag.items)) return false;
  const pos = clampPlacement(x, y);
  bag.canvasPlacements[placementKey] = { ...placement, ...pos };
  return true;
}

export function bringCardPlacementToFront(bag: DocBag, placementKey: string): boolean {
  if (!bag.canvasPlacements[placementKey]) return false;
  if (!cardPlacementItemId(placementKey, bag.canvasPlacements[placementKey], bag.items)) return false;
  assignCardPlacementOrderAtFront(bag.canvasPlacements, bag.items, placementKey);
  return true;
}
