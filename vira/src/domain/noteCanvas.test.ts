import { describe, expect, it } from "vitest";
import {
  NOTE_MIN_HEIGHT,
  NOTE_MIN_WIDTH,
  clampNotePlacement,
  createNote,
  duplicateNotePlacements,
  placeNoteAtWorld,
  resizeNoteRectFromDrag,
} from "./index.ts";

describe("noteCanvas", () => {
  it("clamps note size to minimums", () => {
    const next = clampNotePlacement(0, 0, 40, 40);
    expect(next.width).toBe(NOTE_MIN_WIDTH);
    expect(next.height).toBe(NOTE_MIN_HEIGHT);
  });

  it("resizes from south-east handle", () => {
    const start = { x: 10, y: 20, width: 200, height: 160 };
    const next = resizeNoteRectFromDrag(start, "se", 40, 30);
    expect(next).toMatchObject({ x: 10, y: 20, width: 240, height: 190 });
  });

  it("places a note on the canvas with order", () => {
    const notes: Record<string, ReturnType<typeof createNote>> = {};
    const placements: Record<string, { x: number; y: number; width: number; height: number; order?: string }> = {};
    const bag = { nextNoteId: 1, notes };
    const note = createNote(bag, "hello");
    placeNoteAtWorld(placements, bag.notes, note.id, 100, 80);
    expect(placements[note.id]).toMatchObject({ x: 100, y: 80, width: expect.any(Number), height: expect.any(Number) });
    expect(placements[note.id]?.order).toBeTruthy();
  });

  it("duplicates notes as new entities at given positions", () => {
    const notes: Record<string, ReturnType<typeof createNote>> = {};
    const notePlacements: Record<string, { x: number; y: number; width: number; height: number }> = {};
    const bag = { nextNoteId: 1, notes, notePlacements };
    const original = createNote(bag, "hello", "blue");
    placeNoteAtWorld(notePlacements, bag.notes, original.id, 50, 60, { width: 200, height: 160 });
    const map = duplicateNotePlacements(bag, [original.id], () => ({ x: 50, y: 60 }));
    const copyId = map[original.id];
    expect(copyId).toMatch(/^note-/);
    expect(copyId).not.toBe(original.id);
    expect(bag.notes[copyId]?.body).toBe("hello");
    expect(bag.notes[copyId]?.color).toBe("blue");
    expect(bag.notePlacements[copyId]).toMatchObject({ x: 50, y: 60, width: 200, height: 160 });
    expect(Object.keys(bag.notes)).toHaveLength(2);
  });
});
