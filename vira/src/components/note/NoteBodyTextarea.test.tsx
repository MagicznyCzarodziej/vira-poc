// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { useDocument } from "../../store/index.ts";
import { NoteBodyTextarea } from "./NoteBodyTextarea.tsx";

describe("NoteBodyTextarea", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("renders a textarea for the full note body", () => {
    const id = useDocument.getState().createNoteOnCanvas(0, 0);
    useDocument.getState().cancelEdit();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => {
      root.render(<NoteBodyTextarea noteId={id} body="" />);
    });
    const ta = host.querySelector("textarea.canvas-sticky-note-input");
    expect(ta).toBeTruthy();
    act(() => root.unmount());
  });

  it("persists line breaks in the note body", () => {
    const id = useDocument.getState().createNoteOnCanvas(0, 0);
    useDocument.getState().commitEdit("Line one\nLine two");
    expect(useDocument.getState().notes[id]?.body).toBe("Line one\nLine two");
  });
});
