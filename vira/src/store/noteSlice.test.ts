// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "./index.ts";

describe("noteSlice", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("creates a note on the canvas and opens edit", () => {
    const id = useDocument.getState().createNoteOnCanvas(120, 90);
    expect(id).toMatch(/^note-/);
    expect(useDocument.getState().notePlacements[id]).toMatchObject({ x: 120, y: 90 });
    expect(useDocument.getState().editing).toMatchObject({ id, field: "noteBody", surface: "canvas" });
  });

  it("keeps hash characters in the body on commit", () => {
    const id = useDocument.getState().createNoteOnCanvas(0, 0);
    useDocument.getState().commitEdit("Use #release when ready");
    expect(useDocument.getState().notes[id]?.body).toBe("Use #release when ready");
  });

  it("updates body and color", () => {
    const id = useDocument.getState().createNoteOnCanvas(0, 0);
    useDocument.getState().setNoteBody(id, "See !1/a0");
    useDocument.getState().setNoteColor(id, "blue");
    expect(useDocument.getState().notes[id]?.body).toBe("See !1/a0");
    expect(useDocument.getState().notes[id]?.color).toBe("blue");
  });

  it("duplicateNotesForDrag creates independent copies", () => {
    const id = useDocument.getState().createNoteOnCanvas(80, 90);
    useDocument.getState().setNoteBody(id, "copy me");
    useDocument.getState().setNoteColor(id, "mint");
    useDocument.getState().cancelEdit();
    const map = useDocument.getState().duplicateNotesForDrag([id], { [id]: { x: 80, y: 90 } });
    const copyId = map[id];
    expect(copyId).toBeTruthy();
    expect(copyId).not.toBe(id);
    expect(useDocument.getState().notes[copyId]?.body).toBe("copy me");
    expect(Object.keys(useDocument.getState().notes)).toHaveLength(2);
  });

  it("removes note from canvas", () => {
    const id = useDocument.getState().createNoteOnCanvas(0, 0);
    useDocument.getState().removeNoteFromCanvas(id);
    expect(useDocument.getState().notes[id]).toBeUndefined();
    expect(useDocument.getState().notePlacements[id]).toBeUndefined();
  });
});
