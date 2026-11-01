import type { StateCreator } from "zustand";
import {
  createNote,
  duplicateNotePlacements,
  moveNoteAtWorld,
  placeNoteAtWorld,
  removeNoteFromCanvasPlacements,
  resizeNoteRectFromDrag,
  seedCanvasNotes,
  setNoteBoundsAtWorld,
  type FrameResizeHandle,
  type NoteColor,
} from "../domain/index.ts";
import type { DocumentState } from "./documentTypes.ts";
import { schedule } from "./documentPersistence.ts";

type NoteSlice = Pick<
  DocumentState,
  | "createNoteOnCanvas"
  | "setNoteBody"
  | "setNoteColor"
  | "moveNotePlacements"
  | "resizeNoteFromHandle"
  | "bringNoteToFront"
  | "removeNoteFromCanvas"
  | "duplicateNotesForDrag"
  | "seedCanvasNotes"
>;

export const createNoteSlice: StateCreator<DocumentState, [], [], NoteSlice> = (set, get) => ({
  createNoteOnCanvas: (x, y) => {
    const notes = { ...get().notes };
    const notePlacements = { ...get().notePlacements };
    const bag = { nextNoteId: get().nextNoteId, notes };
    const note = createNote(bag, "");
    placeNoteAtWorld(notePlacements, bag.notes, note.id, x, y);
    set({
      notes: bag.notes,
      notePlacements,
      nextNoteId: bag.nextNoteId,
      revealId: note.id,
      canvasSelection: [note.id],
      editing: { id: note.id, field: "noteBody", step: 0, surface: "canvas" },
      editInitial: "",
      focusNonce: get().focusNonce + 1,
    });
    schedule(get);
    return note.id;
  },
  setNoteBody: (noteId, body) => {
    const note = get().notes[noteId];
    if (!note || note.body === body) return;
    set({ notes: { ...get().notes, [noteId]: { ...note, body } } });
    schedule(get);
  },
  setNoteColor: (noteId, color: NoteColor) => {
    const note = get().notes[noteId];
    if (!note || note.color === color) return;
    set({ notes: { ...get().notes, [noteId]: { ...note, color } } });
    schedule(get);
  },
  moveNotePlacements: (moves) => {
    if (moves.length === 0) return;
    const notePlacements = structuredClone(get().notePlacements);
    const notes = get().notes;
    for (const { id, x, y } of moves) {
      moveNoteAtWorld(notePlacements, notes, id, x, y);
    }
    set({ notePlacements });
    schedule(get);
  },
  resizeNoteFromHandle: (id, handle, start, dx, dy) => {
    const notePlacements = structuredClone(get().notePlacements);
    const bounds = resizeNoteRectFromDrag(start, handle, dx, dy);
    if (!setNoteBoundsAtWorld(notePlacements, get().notes, id, bounds)) return;
    set({ notePlacements });
    schedule(get);
  },
  bringNoteToFront: (id) => {
    const notePlacements = { ...get().notePlacements };
    const notes = get().notes;
    const prev = notePlacements[id];
    if (!prev || !notes[id]) return;
    placeNoteAtWorld(notePlacements, notes, id, prev.x, prev.y, {
      width: prev.width,
      height: prev.height,
    });
    set({ notePlacements });
    schedule(get);
  },
  duplicateNotesForDrag: (noteIds, positions) => {
    if (noteIds.length === 0) return {};
    const notes = { ...get().notes };
    const notePlacements = structuredClone(get().notePlacements);
    const bag = { nextNoteId: get().nextNoteId, notes, notePlacements };
    const keyMap = duplicateNotePlacements(bag, noteIds, (id) => positions[id] ?? null);
    set({
      notes: bag.notes,
      notePlacements: bag.notePlacements,
      nextNoteId: bag.nextNoteId,
    });
    schedule(get);
    return keyMap;
  },
  seedCanvasNotes: (count = 500) => {
    const n = Math.max(0, Math.min(Math.floor(count), 2000));
    if (n === 0) return [];
    const notes = structuredClone(get().notes);
    const notePlacements = structuredClone(get().notePlacements);
    const bag = { nextNoteId: get().nextNoteId, notes, notePlacements };
    const ids = seedCanvasNotes(bag, n);
    set({
      notes: bag.notes,
      notePlacements: bag.notePlacements,
      nextNoteId: bag.nextNoteId,
      canvasSelection: [],
      editing: null,
      revealId: null,
    });
    schedule(get);
    return ids;
  },
  removeNoteFromCanvas: (id) => {
    const notePlacements = { ...get().notePlacements };
    const notes = { ...get().notes };
    removeNoteFromCanvasPlacements(notePlacements, id);
    delete notes[id];
    set({
      notes,
      notePlacements,
      canvasSelection: get().canvasSelection.filter((selected) => selected !== id),
      editing: get().editing?.id === id ? null : get().editing,
    });
    schedule(get);
  },
});
