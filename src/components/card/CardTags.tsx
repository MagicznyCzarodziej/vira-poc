import { useEffect, useRef } from "react";
import { tagStyle, type Card } from "../../domain/index.ts";
import { useDocument } from "../../store/useDocument.ts";
import { editHandoffArmed } from "./AutoTextarea.tsx";

function TagEditor({ initial, onCommit, onCancel }: { initial: string; onCommit: (value: string) => void; onCancel: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      type="text"
      className="inline-input single"
      defaultValue={initial}
      size={Math.min(Math.max(initial.length, 4), 48)}
      onInput={(event) => {
        const input = event.currentTarget;
        input.size = Math.min(Math.max(input.value.length, 4), 48);
      }}
      onBlur={(event) => {
        const value = event.currentTarget.value;
        window.setTimeout(() => {
          if (editHandoffArmed()) return;
          onCommit(value);
        }, 0);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onCommit(event.currentTarget.value);
        }
        if (event.key === "Escape") onCancel();
      }}
    />
  );
}

export function CardTags({
  item,
  readOnly,
  editing,
  editInitial,
  onStart,
}: {
  item: Card;
  readOnly: boolean;
  editing: boolean;
  editInitial: string;
  onStart: () => void;
}) {
  if (editing) {
    return (
      <TagEditor
        initial={editInitial}
        onCommit={(value) => useDocument.getState().commitEdit(value)}
        onCancel={() => useDocument.getState().cancelEdit()}
      />
    );
  }
  return (
    <div
      className="tags-row-edit"
      data-editable={readOnly ? undefined : "tags"}
      data-id={item.id}
      onClick={() => {
        if (readOnly) return;
        onStart();
      }}
    >
      {item.tags.length
        ? <span className="tags-row-tags">{item.tags.map((tag) => <span className="tag" style={tagStyle(tag)} key={tag}>{tag}</span>)}</span>
        : (readOnly ? null : <span className="tags-add">Tags</span>)}
    </div>
  );
}
