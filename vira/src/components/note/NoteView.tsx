import { memo, useCallback, useState, type MouseEvent } from "react";
import { noteColorHex, noteColorIsDark, type Note } from "../../domain/index.ts";
import { useDocument, type Surface } from "../../store/index.ts";
import { FRAME_RESIZE_HANDLES } from "../frame/frameResizeHandles.ts";
import { NoteBodyTextarea } from "./NoteBodyTextarea.tsx";
import { NoteColorMenu } from "./NoteColorMenu.tsx";

export const NoteView = memo(function NoteView({
  note,
  width,
  height,
}: {
  note: Note;
  width: number;
  height: number;
  surface: Surface;
}) {
  const editing = useDocument((state) => state.editing);
  const [colorMenu, setColorMenu] = useState<{ x: number; y: number } | null>(null);
  const focusNewNote =
    editing?.id === note.id && editing.field === "noteBody" && editing.surface === "canvas";

  const openColorMenu = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setColorMenu({ x: event.clientX, y: event.clientY });
  }, []);

  const closeColorMenu = useCallback(() => setColorMenu(null), []);

  return (
    <article
      className="canvas-sticky-note"
      data-note-id={note.id}
      data-note-theme={noteColorIsDark(note.color) ? "dark" : "light"}
      style={{ width, height, ["--note-bg" as string]: noteColorHex(note.color) }}
      onContextMenu={openColorMenu}
    >
      <div className="canvas-sticky-note-body">
        <NoteBodyTextarea noteId={note.id} body={note.body} autoFocus={focusNewNote} />
      </div>
      {FRAME_RESIZE_HANDLES.map((handle) => (
        <div
          key={handle}
          className={`canvas-note-resize canvas-note-resize--${handle}`}
          data-note-resize={handle}
          aria-hidden="true"
        />
      ))}
      {colorMenu ? (
        <NoteColorMenu
          x={colorMenu.x}
          y={colorMenu.y}
          activeColor={note.color}
          onPick={(color) => useDocument.getState().setNoteColor(note.id, color)}
          onClose={closeColorMenu}
        />
      ) : null}
    </article>
  );
});
