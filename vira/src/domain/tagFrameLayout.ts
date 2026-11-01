import { CARD_WIDTH } from "./constants.ts";
import type { Card } from "./types.ts";
import { liveItemIdsWithTag } from "./listTagFilter.ts";
import { normalizeTagName } from "./tags.ts";
import type { FrameRect } from "./frameCanvas.ts";
import { clampFramePlacement } from "./frameCanvas.ts";

export const TAG_FRAME_CARD_HEIGHT = 360;
export const TAG_FRAME_PADDING = 40;
export const TAG_FRAME_GRID_GAP = 28;

export type TagFramePlacementAdd = { itemId: string; x: number; y: number };

export type TagFramePlan = {
  frameTitle: string;
  frameBounds: FrameRect;
  placementAdds: TagFramePlacementAdd[];
};

export function cardFootprintAt(x: number, y: number): FrameRect {
  return { x, y, width: CARD_WIDTH, height: TAG_FRAME_CARD_HEIGHT };
}

export function unionFrameRects(rects: readonly FrameRect[]): FrameRect | null {
  if (rects.length === 0) return null;
  let minX = rects[0]!.x;
  let minY = rects[0]!.y;
  let maxX = rects[0]!.x + rects[0]!.width;
  let maxY = rects[0]!.y + rects[0]!.height;
  for (let i = 1; i < rects.length; i++) {
    const r = rects[i]!;
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function expandFrameRect(rect: FrameRect, padding: number): FrameRect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

export function gridColumnsForCount(count: number): number {
  return Math.max(1, Math.ceil(Math.sqrt(Math.max(1, count))));
}

export function gridSlotPosition(
  index: number,
  originX: number,
  originY: number,
  columns: number,
): { x: number; y: number } {
  const col = index % columns;
  const row = Math.floor(index / columns);
  const cellW = CARD_WIDTH + TAG_FRAME_GRID_GAP;
  const cellH = TAG_FRAME_CARD_HEIGHT + TAG_FRAME_GRID_GAP;
  return {
    x: originX + col * cellW,
    y: originY + row * cellH,
  };
}

export function planTagFrameOnCanvas(
  items: Record<string, Card>,
  anchor: { x: number; y: number },
  tag: string,
): TagFramePlan | null {
  const normalized = normalizeTagName(tag);
  if (!normalized) return null;
  const itemIds = liveItemIdsWithTag(items, normalized);
  if (itemIds.length === 0) return null;

  const cols = gridColumnsForCount(itemIds.length);
  const gridW = cols * CARD_WIDTH + (cols - 1) * TAG_FRAME_GRID_GAP;
  const rows = Math.ceil(itemIds.length / cols);
  const gridH = rows * TAG_FRAME_CARD_HEIGHT + Math.max(0, rows - 1) * TAG_FRAME_GRID_GAP;
  const gridOriginX = anchor.x - gridW / 2;
  const gridOriginY = anchor.y - gridH / 2;

  const placementAdds: TagFramePlacementAdd[] = [];
  const footprints: FrameRect[] = [];

  itemIds.forEach((itemId, index) => {
    const { x, y } = gridSlotPosition(index, gridOriginX, gridOriginY, cols);
    placementAdds.push({ itemId, x, y });
    footprints.push(cardFootprintAt(x, y));
  });

  const content = unionFrameRects(footprints);
  if (!content) return null;
  const padded = expandFrameRect(content, TAG_FRAME_PADDING);
  const frameBounds = clampFramePlacement(padded.x, padded.y, padded.width, padded.height);

  return {
    frameTitle: normalized,
    frameBounds,
    placementAdds,
  };
}
