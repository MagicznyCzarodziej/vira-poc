// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { useDocument } from "../../store/index.ts";
import { NoteView } from "./NoteView.tsx";

describe("NoteView", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    document.body.innerHTML = "";
  });

  it("opens color menu on right click", () => {
    const id = useDocument.getState().createNoteOnCanvas(0, 0);
    const note = useDocument.getState().notes[id]!;
    useDocument.getState().cancelEdit();
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => {
      root.render(<NoteView note={note} width={240} height={180} surface="canvas" />);
    });
    const sticky = host.querySelector(".canvas-sticky-note");
    expect(sticky).toBeTruthy();
    act(() => {
      sticky!.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
    });
    expect(document.querySelector(".canvas-note-color-menu")).toBeTruthy();
    act(() => root.unmount());
  });
});
