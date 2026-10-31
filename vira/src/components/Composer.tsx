import { useState } from "react";
import { tagStyle } from "../domain/index.ts";
import { pickerOpen, useDocument, usePanels } from "../store/index.ts";
import { bindAutocomplete, isTypingTag, menuIsOpen } from "./text/useAutocomplete.ts";
import { useLayoutEffect, useRef } from "react";

export function Composer() {
  const tags = useDocument((state) => state.composerTags);
  const intent = useDocument((state) => state.composerIntent);
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const caret = useRef<number | null>(null);

  useLayoutEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.focus();
    return bindAutocomplete(ta, {
      onTag: (tag) => useDocument.getState().addComposerTag(tag),
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
    <div className="composer" data-composer="root">
      <div className="composer-tags-row tags-row" data-composer-tags-row hidden={tags.length === 0}>
        {tags.length > 0 && (
          <span className="tags-row-tags">
            {tags.map((tag) => (
              <span className="tag" style={tagStyle(tag)} key={tag}>{tag}</span>
            ))}
          </span>
        )}
      </div>
      <textarea
        ref={ref}
        placeholder={
          intent === "question"
            ? "Question — Enter to add, Shift+Enter for new line, @mention, !reference, #tag"
            : "Decision — Enter to add, Shift+Enter for new line, @mention, !reference, #tag"
        }
        data-composer-input
        value={value}
        rows={1}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            useDocument.getState().closeComposer();
            return;
          }
          if (event.key !== "Enter" || event.shiftKey || menuIsOpen()) return;
          const cursor = event.currentTarget.selectionStart ?? value.length;
          if (isTypingTag(value, cursor)) {
            event.preventDefault();
            const match = value.slice(0, cursor).match(/#([\w.-]*)$/);
            if (!match) return;
            useDocument.getState().addComposerTag(match[1] ?? "");
            const start = cursor - match[0].length;
            setValue(`${value.slice(0, start)}${value.slice(cursor)}`);
            return;
          }
          event.preventDefault();
          useDocument.getState().submitComposer(value);
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (menuIsOpen() || pickerOpen(usePanels.getState())) return;
            const active = document.activeElement;
            if (active instanceof Element && active.closest("[data-composer]")) return;
            if (active instanceof Element && active.closest(".ref-link-picker-panel")) return;
            useDocument.getState().submitComposer(ref.current?.value ?? value);
          }, 0);
        }}
      />
    </div>
  );
}

export function NewCardTriggers() {
  return (
    <div className="add-triggers" role="group" aria-label="Add card">
      <button type="button" className="add-trigger" data-action="add-decision" onClick={() => useDocument.getState().openNewDecision()}>
        New decision
      </button>
      <button type="button" className="add-trigger" data-action="add-question" onClick={() => useDocument.getState().openNewQuestion()}>
        New question
      </button>
    </div>
  );
}
