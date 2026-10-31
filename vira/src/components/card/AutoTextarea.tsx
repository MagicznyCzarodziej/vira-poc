import { useLayoutEffect, useRef, useState } from "react";
import { pickerOpen, useDocument, usePanels } from "../../store/index.ts";
import { bindAutocomplete, isTypingTag, menuIsOpen } from "../text/useAutocomplete.ts";

let handoff = false;

export function armEditHandoff(on: boolean) {
  handoff = on;
}

export function editHandoffArmed() {
  return handoff;
}

export function AutoTextarea({
  initial,
  className,
  onCommit,
  onEnterCommit,
  onCancel,
  onTag,
  dataset,
}: {
  initial: string;
  className: string;
  onCommit: (value: string) => void;
  onEnterCommit?: (value: string) => void;
  onCancel: () => void;
  onTag?: (tag: string) => void;
  dataset: Record<string, string>;
}) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);
  const valueRef = useRef(value);
  const onTagRef = useRef(onTag);
  valueRef.current = value;
  onTagRef.current = onTag;

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    const pos = caret.current ?? ta.value.length;
    ta.setSelectionRange(pos, pos);
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
    return bindAutocomplete(ta, {
      onTag: (tag) => onTagRef.current?.(tag),
      onValue: (next, cursor) => {
        caret.current = cursor;
        setValue(next);
      },
    });
  }, []);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
    if (caret.current != null) {
      ta.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={className}
      rows={1}
      value={value}
      {...Object.fromEntries(Object.entries(dataset).map(([key, val]) => [`data-${key}`, val]))}
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        const snapshot = useDocument.getState().editing;
        window.setTimeout(() => {
          if (!snapshot || handoff || menuIsOpen() || pickerOpen(usePanels.getState())) return;
          const current = useDocument.getState().editing;
          const replaced = current != null && (
            current.id !== snapshot.id
            || current.field !== snapshot.field
            || current.step !== snapshot.step
            || current.surface !== snapshot.surface
          );
          if (replaced) return;
          onCommit(valueRef.current);
        }, 0);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
          return;
        }
        if (event.key !== "Enter" || event.shiftKey) return;
        if (menuIsOpen()) return;
        const ta = ref.current;
        const cursor = ta?.selectionStart ?? value.length;
        if (ta && isTypingTag(value, cursor)) {
          event.preventDefault();
          const match = value.slice(0, cursor).match(/#([\w.-]*)$/);
          const name = match?.[1]?.trim().toLowerCase();
          if (!name || !match) return;
          const start = cursor - match[0].length;
          onTag?.(name);
          setValue(`${value.slice(0, start)}${value.slice(cursor)}`);
          return;
        }
        event.preventDefault();
        (onEnterCommit ?? onCommit)(value);
      }}
    />
  );
}
