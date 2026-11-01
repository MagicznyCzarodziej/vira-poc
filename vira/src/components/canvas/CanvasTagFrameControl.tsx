import { useEffect, useRef } from "react";
import { allKnownTags, tagStyle } from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { IconFrameWithTag } from "../Icons.tsx";

export function CanvasTagFrameControl() {
  const items = useDocument((state) => state.items);
  const menuOpen = useDocument((state) => state.tagFrameMenuOpen);
  const placementTag = useDocument((state) => state.tagFramePlacementTag);
  const setTagFrameMenuOpen = useDocument((state) => state.setTagFrameMenuOpen);
  const setTagFramePlacementTag = useDocument((state) => state.setTagFramePlacementTag);
  const cancelTagFramePlacement = useDocument((state) => state.cancelTagFramePlacement);
  const tags = allKnownTags(items);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setTagFrameMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuOpen, setTagFrameMenuOpen]);

  if (tags.length === 0) return null;

  const active = menuOpen || !!placementTag;

  return (
    <div className="canvas-tag-frame-control" ref={rootRef} aria-label="Frame decisions by tag">
      <button
        type="button"
        className={`canvas-spawn-btn canvas-tag-frame-btn${active ? " is-active" : ""}`}
        data-action="open-tag-frame-menu"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={
          placementTag
            ? `Placing frame for “${placementTag}” — click on canvas (Esc to cancel)`
            : "Frame by tag — choose tag, then click canvas"
        }
        title={
          placementTag
            ? `Click canvas to place “${placementTag}” frame (Esc cancels)`
            : "Choose a tag, then click where the frame should go"
        }
        onClick={() => {
          if (placementTag) {
            cancelTagFramePlacement();
            return;
          }
          setTagFrameMenuOpen(!menuOpen);
        }}
      >
        <IconFrameWithTag />
      </button>
      {menuOpen ? (
        <div className="canvas-tag-frame-menu" role="menu" aria-label="Tags">
          <p className="canvas-tag-frame-menu-hint">Pick a tag, then click the canvas.</p>
          <ul className="canvas-tag-frame-menu-list">
            {tags.map((tag) => (
              <li key={tag}>
                <button
                  type="button"
                  className="canvas-tag-frame-menu-item tag"
                  role="menuitem"
                  data-action="pick-frame-tag"
                  style={tagStyle(tag)}
                  onClick={() => setTagFramePlacementTag(tag)}
                >
                  {tag}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
