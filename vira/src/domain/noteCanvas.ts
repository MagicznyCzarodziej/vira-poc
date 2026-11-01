import { WORLD_H, WORLD_W } from "./constants.ts";
import {
  assignOrderAtFront,
  clampPlacement,
  ensurePlacementOrder,
  sortedPlacementIds,
} from "./canvas.ts";
import { createNote, type NoteBag } from "./notes.ts";
import type { FrameRect, FrameResizeHandle } from "./frameCanvas.ts";
import type { Note, NotePlacement } from "./types.ts";

export type NoteCanvasBag = NoteBag & {
  notePlacements: Record<string, NotePlacement>;
};

export const NOTE_DEFAULT_WIDTH = 240;
export const NOTE_DEFAULT_HEIGHT = 180;
export const NOTE_MIN_WIDTH = 120;
export const NOTE_MIN_HEIGHT = 52;

export function clampNoteSize(width: number, height: number): { width: number; height: number } {
  return {
    width: Math.max(NOTE_MIN_WIDTH, Math.min(width, WORLD_W)),
    height: Math.max(NOTE_MIN_HEIGHT, Math.min(height, WORLD_H)),
  };
}

export function clampNotePlacement(
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } {
  const size = clampNoteSize(width, height);
  const pos = clampPlacement(x, y);
  return {
    x: Math.max(8, Math.min(pos.x, WORLD_W - size.width - 8)),
    y: Math.max(8, Math.min(pos.y, WORLD_H - size.height - 8)),
    width: size.width,
    height: size.height,
  };
}

export function resizeNoteRectFromDrag(
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

  if (width < NOTE_MIN_WIDTH) {
    if (handle.includes("w")) x = start.x + start.width - NOTE_MIN_WIDTH;
    width = NOTE_MIN_WIDTH;
  }
  if (height < NOTE_MIN_HEIGHT) {
    if (handle.includes("n")) y = start.y + start.height - NOTE_MIN_HEIGHT;
    height = NOTE_MIN_HEIGHT;
  }

  return clampNotePlacement(x, y, width, height);
}

export function sortedNotePlacementIds(
  placements: Record<string, NotePlacement>,
  notes: Record<string, Note>,
): string[] {
  const items = Object.fromEntries(
    Object.keys(placements)
      .filter((id) => notes[id])
      .map((id) => [id, { id }]),
  ) as Record<string, { id: string }>;
  return sortedPlacementIds(placements, items as never);
}

export function placeNoteAtWorld(
  placements: Record<string, NotePlacement>,
  notes: Record<string, Note>,
  id: string,
  x: number,
  y: number,
  size: { width?: number; height?: number } = {},
): void {
  if (!notes[id]) return;
  const prev = placements[id];
  const width = size.width ?? prev?.width ?? NOTE_DEFAULT_WIDTH;
  const height = size.height ?? prev?.height ?? NOTE_DEFAULT_HEIGHT;
  const next = clampNotePlacement(x, y, width, height);
  placements[id] = { ...prev, ...next, order: prev?.order };
  const pseudoItems = Object.fromEntries(Object.keys(notes).map((key) => [key, { id: key }]));
  ensurePlacementOrder(placements, pseudoItems as never, id);
  assignOrderAtFront(placements, pseudoItems as never, id);
}

export function moveNoteAtWorld(
  placements: Record<string, NotePlacement>,
  notes: Record<string, Note>,
  id: string,
  x: number,
  y: number,
): boolean {
  const prev = placements[id];
  if (!prev || !notes[id]) return false;
  const next = clampNotePlacement(x, y, prev.width, prev.height);
  placements[id] = { ...prev, x: next.x, y: next.y };
  return true;
}

export function setNoteBoundsAtWorld(
  placements: Record<string, NotePlacement>,
  notes: Record<string, Note>,
  id: string,
  bounds: FrameRect,
): boolean {
  const prev = placements[id];
  if (!prev || !notes[id]) return false;
  const next = clampNotePlacement(bounds.x, bounds.y, bounds.width, bounds.height);
  placements[id] = { ...prev, ...next };
  return true;
}

export function removeNoteFromCanvasPlacements(
  placements: Record<string, NotePlacement>,
  id: string,
): void {
  delete placements[id];
}

/** New note entities at given positions (same body/color/size; not linked to originals). */
export function duplicateNotePlacements(
  bag: NoteCanvasBag,
  noteIds: readonly string[],
  positionForId: (id: string) => { x: number; y: number } | null,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const id of noteIds) {
    const note = bag.notes[id];
    const placement = bag.notePlacements[id];
    if (!note || !placement) {
      map[id] = id;
      continue;
    }
    const pos = positionForId(id) ?? placement;
    const copy = createNote(bag, note.body, note.color);
    placeNoteAtWorld(bag.notePlacements, bag.notes, copy.id, pos.x, pos.y, {
      width: placement.width,
      height: placement.height,
    });
    map[id] = copy.id;
  }
  return map;
}
