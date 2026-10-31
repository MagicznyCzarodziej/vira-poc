import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { selectionAnchor, type SelectionAnchor } from "./selectionGeometry.ts";

export function SelectionRefToolbar() {
  const [sel, setSel] = useState<SelectionAnchor | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const selRef = useRef(sel);
  selRef.current = sel;

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || !sel) return;
    const margin = 8;
    const width = bar.offsetWidth || 160;
    const height = bar.offsetHeight || 36;
    const left = Math.min(Math.max(margin, sel.x - width / 2), window.innerWidth - width - margin);
    const top = Math.max(margin, sel.y - height - 6);
    bar.style.left = `${left}px`;
    bar.style.top = `${top}px`;
  }, [sel]);

  useEffect(() => {
    const mirror = document.createElement("div");
    mirror.setAttribute("aria-hidden", "true");
    mirror.style.position = "fixed";
    mirror.style.visibility = "hidden";
    mirror.style.pointerEvents = "none";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.overflowWrap = "anywhere";
    mirror.style.wordBreak = "break-word";
    mirror.style.zIndex = "-1";
    document.body.append(mirror);

    let timer = 0;
    const apply = (next: SelectionAnchor | null) => {
      setSel((prev) => {
        if (!next) return null;
        if (
          prev
          && prev.textarea === next.textarea
          && prev.start === next.start
          && prev.end === next.end
          && prev.label === next.label
          && prev.x === next.x
          && prev.y === next.y
        ) return prev;
        return next;
      });
    };

    const onMouseUp = (event: MouseEvent) => {
      if (barRef.current?.contains(event.target as Node)) return;
      if (event.target instanceof Element && event.target.closest(".mention-menu")) return;
      const target = event.target;
      const x = event.clientX;
      const y = event.clientY;
      const reading = selectionAnchor(target, mirror, x, y);
      window.clearTimeout(timer);
      if (reading === undefined) {
        apply(null);
        return;
      }
      timer = window.setTimeout(() => apply(selectionAnchor(target, mirror, x, y) ?? null), 0);
    };

    const onSelectionChange = () => {
      const current = selRef.current;
      if (!current) return;
      if (!current.textarea.isConnected || document.activeElement !== current.textarea) {
        apply(null);
        return;
      }
      apply(selectionAnchor(current.textarea, mirror) ?? null);
    };

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("selectionchange", onSelectionChange);
      mirror.remove();
    };
  }, []);

  if (!sel) return null;

  return (
    <div
      ref={barRef}
      className="selection-ref-toolbar"
      role="toolbar"
      onMouseDown={(event) => event.preventDefault()}
    >
      <button
        type="button"
        className="selection-ref-toolbar-btn"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const ta = sel.textarea;
          window.dispatchEvent(new CustomEvent("vira:open-ref-picker", {
            detail: {
              textarea: ta,
              label: sel.label,
              start: sel.start,
              end: sel.end,
              textSnapshot: ta.value,
              canvas: !!ta.closest(".canvas-placed-card"),
              mode: ta.matches("[data-composer-input]") ? "composer" : ta.matches("[data-followup-input]") ? "followup" : "inline",
              itemId: ta.dataset.refItemId || ta.dataset.id,
              field: ta.dataset.refField === "answer" ? "answer" : ta.dataset.refField === "problem" ? "problem" : undefined,
              stepIndex: ta.dataset.refStep ? Number(ta.dataset.refStep) : undefined,
            },
          }));
          setSel(null);
        }}
      >
        Link to decision…
      </button>
    </div>
  );
}
