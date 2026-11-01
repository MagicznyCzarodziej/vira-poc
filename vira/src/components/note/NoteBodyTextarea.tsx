import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDocument } from "../../store/index.ts";
import { bindAutocomplete } from "../text/useAutocomplete.ts";
import { RichText } from "../text/RichText.tsx";
import { registerTextareaCompose } from "../text/textareaComposeSync.ts";

export function NoteBodyTextarea({
  noteId,
  body,
  autoFocus = false,
}: {
  noteId: string;
  body: string;
  autoFocus?: boolean;
}) {
  const [value, setValue] = useState(body);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const showRefPreview = !focused && body.trim().length > 0;

  useEffect(() => {
    if (document.activeElement === ref.current) return;
    setValue(body);
  }, [body]);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    const onValue = (next: string, cursor: number) => {
      caret.current = cursor;
      setValue(next);
      useDocument.getState().setNoteBody(noteId, next);
    };
    const unregisterCompose = registerTextareaCompose(ta, { tags: false, onValue });
    if (autoFocus) {
      const pos = ta.value.length;
      ta.focus();
      setFocused(true);
      ta.setSelectionRange(pos, pos);
    }
    const unbindAutocomplete = bindAutocomplete(ta, { tags: false, onValue });
    return () => {
      unregisterCompose();
      unbindAutocomplete();
    };
  }, [autoFocus, noteId]);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    if (caret.current != null) {
      ta.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [value]);

  const commit = () => {
    const next = valueRef.current;
    const editing = useDocument.getState().editing;
    if (editing?.id === noteId && editing.field === "noteBody") {
      useDocument.getState().commitEdit(next);
      return;
    }
    useDocument.getState().setNoteBody(noteId, next);
  };

  return (
    <div className="canvas-sticky-note-body-inner">
      {showRefPreview ? (
        <div
          className="canvas-sticky-note-reflayer"
          onPointerDown={(event) => {
            if (event.target instanceof Element && event.target.closest("[data-action='goto-issue'], button")) {
              return;
            }
            event.preventDefault();
            ref.current?.focus();
          }}
        >
          <RichText text={body} />
        </div>
      ) : null}
      <textarea
        ref={ref}
        className={`inline-input canvas-sticky-note-input${showRefPreview ? " is-ref-preview-hidden" : ""}`}
        data-note-id={noteId}
        data-editable="noteBody"
        placeholder="Write a note… @mention · !reference"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          window.setTimeout(() => commit(), 0);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setValue(body);
            useDocument.getState().cancelEdit();
            ref.current?.blur();
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
      />
    </div>
  );
}
