import { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { NOTE_COLORS, noteColorHex, noteColorLabel } from "../../domain/index.ts";
import type { NoteColor } from "../../domain/types.ts";

export function NoteColorMenu({
  x,
  y,
  activeColor,
  onPick,
  onClose,
}: {
  x: number;
  y: number;
  activeColor: NoteColor;
  onPick: (color: NoteColor) => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const rect = el.getBoundingClientRect();
    let left = x;
    let top = y;
    if (rect.right > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - rect.width - 8);
    }
    if (rect.bottom > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - rect.height - 8);
    }
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [x, y]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={menuRef}
      className="canvas-note-color-menu"
      role="menu"
      aria-label="Note color"
      style={{ left: x, top: y }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <p className="canvas-note-color-menu-label">Background</p>
      <div className="canvas-note-color-menu-swatches" role="group">
        {NOTE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            role="menuitemradio"
            className={`canvas-sticky-note-swatch${activeColor === color ? " is-active" : ""}`}
            style={{ backgroundColor: noteColorHex(color) }}
            aria-label={`${noteColorLabel(color)} background`}
            aria-checked={activeColor === color}
            title={noteColorLabel(color)}
            onClick={() => {
              onPick(color);
              onClose();
            }}
          />
        ))}
      </div>
    </div>,
    document.body,
  );
}
