import { useEffect, useRef } from "react";
import { WORLD_H, WORLD_W, isItemArchived, sortedPlacementIds } from "../../domain/index.ts";
import { useDocument } from "../../store/useDocument.ts";
import { CardView } from "../CardView.tsx";
import { IconCard } from "../Icons.tsx";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";
import { bindCanvasRefLinks } from "./bindCanvasRefLinks.ts";
import { placeCenteredCard, zoomCanvas } from "./canvasCommands.ts";
import { SPAWN, type SpawnGesture } from "./canvasDrop.ts";
import { FakeScrollbars } from "./FakeScrollbars.tsx";

export function CanvasWorkspace() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const spawnGesture = useRef<SpawnGesture | null>(null);
  const spawnAt = useRef(0);
  const items = useDocument((state) => state.items);
  const placements = useDocument((state) => state.canvasPlacements);
  const viewport = useDocument((state) => state.canvasViewport);
  const userSet = useDocument((state) => state.canvasViewportUserSet);
  const revealId = useDocument((state) => state.revealId);
  const ids = sortedPlacementIds(placements, items).filter((id) => items[id] && !isItemArchived(items[id]));
  const centered = useRef(false);
  const lineRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const world = surface.querySelector<HTMLElement>(".canvas-world");
    const content = surface.querySelector<HTMLElement>("[data-canvas-scroll-content]");
    if (!world || !content) return;
    world.style.width = `${WORLD_W}px`;
    world.style.height = `${WORLD_H}px`;
    world.style.transform = `scale(${viewport.zoom})`;
    world.style.transformOrigin = "0 0";
    content.style.width = `${Math.ceil(WORLD_W * viewport.zoom)}px`;
    content.style.height = `${Math.ceil(WORLD_H * viewport.zoom)}px`;
    const maxLeft = Math.max(0, content.offsetWidth - surface.clientWidth);
    const maxTop = Math.max(0, content.offsetHeight - surface.clientHeight);
    let left = viewport.scrollLeft;
    let top = viewport.scrollTop;
    if (!userSet && !centered.current) {
      left = Math.max(0, Math.round((content.offsetWidth - surface.clientWidth) / 2));
      top = Math.max(0, Math.round((content.offsetHeight - surface.clientHeight) / 2));
      centered.current = true;
      useDocument.getState().setViewport({ ...viewport, scrollLeft: left, scrollTop: top }, false);
    }
    surface.scrollLeft = Math.min(Math.max(0, left), maxLeft);
    surface.scrollTop = Math.min(Math.max(0, top), maxTop);
  }, [viewport, userSet, ids.length]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    return bindCanvasGestures(surface, spawnGesture);
  }, []);

  useEffect(() => {
    const root = document.getElementById("app");
    if (!root) return;
    return bindCanvasRefLinks(root, surfaceRef, lineRef);
  }, [ids.length]);

  const pct = Math.round(viewport.zoom * 100);
  const zoomBy = (factor: number) => zoomCanvas(surfaceRef, factor);
  const spawnCenteredCard = () => placeCenteredCard(surfaceRef, spawnAt);

  return (
    <>
      <div className="canvas-frame" data-canvas-frame>
        <div className="canvas-surface-shell">
          <div className="spatial-canvas" data-canvas-surface role="region" aria-label="Decision canvas" ref={surfaceRef}>
            <div className="canvas-scroll-content" data-canvas-scroll-content>
              <div className="canvas-world">
                {ids.length === 0 && (
                  <p className="canvas-hint">Drag cards from the list · C with pointer on canvas for a new card · Space+drag to pan · pinch or ⌘/Ctrl+scroll to zoom</p>
                )}
                {ids.map((id, index) => {
                  const item = items[id];
                  const pos = placements[id];
                  if (!item || !pos) return null;
                  return (
                    <div
                      key={id}
                      className={`canvas-placed-card${revealId === id ? " is-canvas-reveal-pop" : ""}`}
                      data-canvas-placed={id}
                      style={{ left: pos.x, top: pos.y, zIndex: index + 1 }}
                      onAnimationEnd={() => useDocument.getState().clearReveal()}
                    >
                      <CardView item={item} surface="canvas" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <svg className="canvas-ref-links" data-canvas-ref-links aria-hidden="true" ref={lineRef} />
          <FakeScrollbars surfaceRef={surfaceRef} />
        </div>
      </div>
      <button
        type="button"
        className="canvas-spawn-btn"
        data-action="canvas-spawn-card"
        data-canvas-spawn
        draggable
        aria-label="Add card — click or drag onto canvas"
        title="Add card (click or drag)"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const active = document.activeElement;
          if (
            (active instanceof HTMLTextAreaElement || active instanceof HTMLInputElement)
            && active.closest(".card, .composer")
          ) {
            useDocument.getState().commitEdit(active.value);
          }
          spawnGesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, dist: 0, drag: false, dropped: false };
        }}
        onPointerMove={(event) => {
          const gesture = spawnGesture.current;
          if (!gesture || gesture.id !== event.pointerId) return;
          const dx = event.clientX - gesture.x;
          const dy = event.clientY - gesture.y;
          gesture.dist = Math.max(gesture.dist, dx * dx + dy * dy);
        }}
        onPointerUp={(event) => {
          const gesture = spawnGesture.current;
          if (!gesture || gesture.id !== event.pointerId) return;
          window.setTimeout(() => {
            if (gesture.drag || gesture.dropped) return;
            spawnGesture.current = null;
            spawnCenteredCard();
          }, 0);
        }}
        onDragStart={(event) => {
          if (spawnGesture.current) spawnGesture.current.drag = true;
          event.dataTransfer.setData("text/plain", SPAWN);
          event.dataTransfer.effectAllowed = "copy";
        }}
        onDragEnd={() => {
          const gesture = spawnGesture.current;
          if (!gesture) return;
          const micro = gesture.drag && !gesture.dropped && gesture.dist <= 36;
          spawnGesture.current = null;
          if (micro) spawnCenteredCard();
          else if (gesture.drag) spawnAt.current = Date.now();
        }}
        onClick={() => {
          if (Date.now() - spawnAt.current < 400) return;
          const gesture = spawnGesture.current;
          if (gesture?.drag || gesture?.dropped) return;
          spawnCenteredCard();
        }}
      >
        <IconCard />
      </button>
      <div className="canvas-zoom-controls" aria-label="Canvas zoom">
        <button type="button" className="canvas-zoom-btn" data-action="canvas-zoom-out" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.15)}>−</button>
        <button type="button" className="canvas-zoom-btn canvas-zoom-btn--label" data-action="canvas-zoom-reset" aria-label="Reset zoom to 100%" onClick={() => useDocument.getState().setViewport({ ...useDocument.getState().canvasViewport, zoom: 1 })}>{pct}%</button>
        <button type="button" className="canvas-zoom-btn" data-action="canvas-zoom-in" aria-label="Zoom in" onClick={() => zoomBy(1.15)}>+</button>
      </div>
    </>
  );
}
