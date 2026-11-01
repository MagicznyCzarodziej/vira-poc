import { useEffect, useRef } from "react";
import {
  WORLD_H,
  WORLD_W,
  isItemArchived,
  sortedActionPointPlacementIds,
  sortedCardPlacementKeys,
} from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { ActionPointView } from "../action/ActionPointView.tsx";
import { CardView } from "../CardView.tsx";
import { IconCard, IconLightbulb } from "../Icons.tsx";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";
import { bindCanvasRefLinks } from "./bindCanvasRefLinks.ts";
import { zoomCanvas } from "./canvasCommands.ts";
import { CanvasSpawnButton } from "./canvasSpawnButton.tsx";
import type { SpawnGesture } from "./canvasDrop.ts";
import { FakeScrollbars } from "./FakeScrollbars.tsx";

export function CanvasWorkspace() {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const spawnGesture = useRef<SpawnGesture | null>(null);
  const spawnAt = useRef(0);
  const items = useDocument((state) => state.items);
  const actionPoints = useDocument((state) => state.actionPoints);
  const placements = useDocument((state) => state.canvasPlacements);
  const apPlacements = useDocument((state) => state.actionPointPlacements);
  const viewport = useDocument((state) => state.canvasViewport);
  const userSet = useDocument((state) => state.canvasViewportUserSet);
  const revealId = useDocument((state) => state.revealId);
  const canvasSelection = useDocument((state) => state.canvasSelection);
  const selectedSet = new Set(canvasSelection);
  const ids = sortedCardPlacementKeys(placements, items);
  const apIds = sortedActionPointPlacementIds(apPlacements, actionPoints).filter((id) => actionPoints[id]);
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
  }, [viewport, userSet, ids.length, apIds.length]);

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
  return (
    <>
      <div className="canvas-frame" data-canvas-frame>
        <div className="canvas-surface-shell">
          <div className="spatial-canvas" data-canvas-surface role="region" aria-label="Decision canvas" ref={surfaceRef}>
            <div className="canvas-scroll-content" data-canvas-scroll-content>
              <div className="canvas-world">
                {ids.length === 0 && apIds.length === 0 && (
                  <p className="canvas-hint">Drag decisions or actions from the list · drag empty canvas to select · Space+drag to pan · ⌘/Ctrl+scroll to zoom</p>
                )}
                {apIds.map((id, index) => {
                  const ap = actionPoints[id];
                  const pos = apPlacements[id];
                  if (!ap || !pos) return null;
                  return (
                    <div
                      key={id}
                      className={`canvas-placed-action-point${revealId === id ? " is-canvas-reveal-pop" : ""}${selectedSet.has(id) ? " is-canvas-selected" : ""}`}
                      data-canvas-placed={id}
                      style={{ left: pos.x, top: pos.y, zIndex: ids.length + index + 1 }}
                      onAnimationEnd={() => useDocument.getState().clearReveal()}
                    >
                      <ActionPointView actionPoint={ap} surface="canvas" />
                    </div>
                  );
                })}
                {ids.map((placementKey, index) => {
                  const pos = placements[placementKey];
                  const itemId = pos?.itemId ?? placementKey;
                  const item = items[itemId];
                  if (!item || !pos) return null;
                  return (
                    <div
                      key={placementKey}
                      className={`canvas-placed-card${revealId === placementKey ? " is-canvas-reveal-pop" : ""}${selectedSet.has(placementKey) ? " is-canvas-selected" : ""}`}
                      data-canvas-placed={placementKey}
                      data-canvas-item-id={itemId}
                      style={{ left: pos.x, top: pos.y, zIndex: index + 1 }}
                      onAnimationEnd={() => useDocument.getState().clearReveal()}
                    >
                      <CardView item={item} surface="canvas" canvasPlacementKey={placementKey} />
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
      <div className="canvas-spawn-group" aria-label="Add card to canvas">
        <CanvasSpawnButton
          intent="question"
          spawnGesture={spawnGesture}
          spawnAt={spawnAt}
          surfaceRef={surfaceRef}
          aria-label="New question — click or drag onto canvas"
          title="New question (click or drag)"
        >
          <IconCard />
        </CanvasSpawnButton>
        <CanvasSpawnButton
          intent="decision"
          spawnGesture={spawnGesture}
          spawnAt={spawnAt}
          surfaceRef={surfaceRef}
          aria-label="New decision — click or drag onto canvas"
          title="New decision (click or drag)"
        >
          <IconLightbulb />
        </CanvasSpawnButton>
      </div>
      <div className="canvas-zoom-controls" aria-label="Canvas zoom">
        <button type="button" className="canvas-zoom-btn" data-action="canvas-zoom-out" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.15)}>−</button>
        <button type="button" className="canvas-zoom-btn canvas-zoom-btn--label" data-action="canvas-zoom-reset" aria-label="Reset zoom to 100%" onClick={() => useDocument.getState().setViewport({ ...useDocument.getState().canvasViewport, zoom: 1 })}>{pct}%</button>
        <button type="button" className="canvas-zoom-btn" data-action="canvas-zoom-in" aria-label="Zoom in" onClick={() => zoomBy(1.15)}>+</button>
      </div>
    </>
  );
}
