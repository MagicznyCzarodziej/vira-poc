import type { Note } from "./types.ts";
import { DEFAULT_NOTE_COLOR, normalizeNoteColor, type NoteColor } from "./noteColors.ts";

export type NoteBag = {
  nextNoteId: number;
  notes: Record<string, Note>;
};

export type { NoteColor };
export {
  DEFAULT_NOTE_COLOR,
  NOTE_COLORS,
  NOTE_COLOR_MAP,
  normalizeNoteColor,
  noteColorHex,
  noteColorIsDark,
  noteColorLabel,
} from "./noteColors.ts";

export function recomputeNextNoteId(notes: Record<string, Note>): number {
  let max = 0;
  for (const id of Object.keys(notes)) {
    const match = id.match(/^note-(\d+)$/i);
    if (match) max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
  }
  return max + 1;
}

export function createNote(
  bag: NoteBag,
  body = "",
  color: NoteColor = DEFAULT_NOTE_COLOR,
  now = new Date().toISOString(),
): Note {
  const id = `note-${bag.nextNoteId}`;
  bag.nextNoteId += 1;
  const note: Note = {
    id,
    body,
    color: normalizeNoteColor(color),
    createdAt: now,
  };
  bag.notes[id] = note;
  return note;
}
