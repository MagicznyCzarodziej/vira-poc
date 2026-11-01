import { WORLD_H, WORLD_W } from "./constants.ts";
import {
  assignOrderAtFront,
  clampPlacement,
  ensurePlacementOrder,
  sortedPlacementIds,
} from "./canvas.ts";
import type { Frame, FramePlacement } from "./types.ts";

export const FRAME_DEFAULT_WIDTH = 520;
export const FRAME_DEFAULT_HEIGHT = 360;
export const FRAME_MIN_WIDTH = 200;
export const FRAME_MIN_HEIGHT = 140;

export type FrameResizeHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type FrameRect = { x: number; y: number; width: number; height: number };

export function resizeFrameRectFromDrag(
  start: FrameRect,
  handle: FrameResizeHandle,
  dx: number,
  dy: number,
): FrameRect {
  let { x, y, width, height } = start;

  if (handle.includes("e")) width = start.width + dx;
  if (handle.includes("w")) {
    width = start.width - dx;
    x = start.x + dx;
  }
  if (handle.includes("s")) height = start.height + dy;
  if (handle.includes("n")) {
    height = start.height - dy;
    y = start.y + dy;
  }

  if (width < FRAME_MIN_WIDTH) {
    if (handle.includes("w")) x = start.x + start.width - FRAME_MIN_WIDTH;
    width = FRAME_MIN_WIDTH;
  }
  if (height < FRAME_MIN_HEIGHT) {
    if (handle.includes("n")) y = start.y + start.height - FRAME_MIN_HEIGHT;
    height = FRAME_MIN_HEIGHT;
  }

  return clampFramePlacement(x, y, width, height);
}

export function clampFrameSize(width: number, height: number): { width: number; height: number } {
  return {
    width: Math.max(FRAME_MIN_WIDTH, Math.min(width, WORLD_W)),
    height: Math.max(FRAME_MIN_HEIGHT, Math.min(height, WORLD_H)),
  };
}

export function clampFramePlacement(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } {
  const size = clampFrameSize(width, height);
  const pos = clampPlacement(x, y);
  return {
    x: Math.max(8, Math.min(pos.x, WORLD_W - size.width - 8)),
    y: Math.max(8, Math.min(pos.y, WORLD_H - size.height - 8)),
    width: size.width,
    height: size.height,
  };
}

export function sortedFramePlacementIds(
  placements: Record<string, FramePlacement>,
  frames: Record<string, Frame>,
): string[] {
  const items = Object.fromEntries(
    Object.keys(placements)
      .filter((id) => frames[id])
      .map((id) => [id, { id }]),
  ) as Record<string, { id: string }>;
  return sortedPlacementIds(placements, items as never);
}

export function placeFrameAtWorld(
  placements: Record<string, FramePlacement>,
  frames: Record<string, Frame>,
  id: string,
  x: number,
  y: number,
  size: { width?: number; height?: number } = {},
): void {
  if (!frames[id]) return;
  const prev = placements[id];
  const width = size.width ?? prev?.width ?? FRAME_DEFAULT_WIDTH;
  const height = size.height ?? prev?.height ?? FRAME_DEFAULT_HEIGHT;
  const next = clampFramePlacement(x, y, width, height);
  placements[id] = { ...prev, ...next, order: prev?.order };
  const pseudoItems = Object.fromEntries(Object.keys(frames).map((key) => [key, { id: key }]));
  ensurePlacementOrder(placements, pseudoItems as never, id);
  assignOrderAtFront(placements, pseudoItems as never, id);
}

export function moveFrameAtWorld(
  placements: Record<string, FramePlacement>,
  frames: Record<string, Frame>,
  id: string,
  x: number,
  y: number,
): boolean {
  const prev = placements[id];
  if (!prev || !frames[id]) return false;
  const next = clampFramePlacement(x, y, prev.width, prev.height);
  placements[id] = { ...prev, x: next.x, y: next.y };
  return true;
}

export function setFrameBoundsAtWorld(
  placements: Record<string, FramePlacement>,
  frames: Record<string, Frame>,
  id: string,
  bounds: FrameRect,
): boolean {
  const prev = placements[id];
  if (!prev || !frames[id]) return false;
  const next = clampFramePlacement(bounds.x, bounds.y, bounds.width, bounds.height);
  placements[id] = { ...prev, ...next };
  return true;
}

/** @deprecated Prefer setFrameBoundsAtWorld — kept for simple south-east resize callers. */
export function resizeFrameAtWorld(
  placements: Record<string, FramePlacement>,
  frames: Record<string, Frame>,
  id: string,
  width: number,
  height: number,
): boolean {
  const prev = placements[id];
  if (!prev || !frames[id]) return false;
  return setFrameBoundsAtWorld(placements, frames, id, {
    x: prev.x,
    y: prev.y,
    width,
    height,
  });
}

export function removeFrameFromCanvasPlacements(
  placements: Record<string, FramePlacement>,
  id: string,
): void {
  delete placements[id];
}
