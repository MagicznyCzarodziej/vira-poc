import { useEffect, useRef } from "react";
import {
  WORLD_H,
  WORLD_W,
  isItemArchived,
  sortedActionPointPlacementIds,
  sortedCardPlacementKeys,
  localOccluderRectsForFrame,
  sortedFramePlacementIdsForPaint,
  sortedNotePlacementIds,
} from "../../domain/index.ts";
import { useDocument } from "../../store/index.ts";
import { ActionPointView } from "../action/ActionPointView.tsx";
import { CardView } from "../CardView.tsx";
import { FrameView } from "../frame/FrameView.tsx";
import { NoteView } from "../note/NoteView.tsx";
import { IconCard, IconLightbulb, IconStickyNote } from "../Icons.tsx";
import { applyCanvasWorldScale } from "./canvasWorldZoom.ts";
import { bindCanvasGestures } from "./bindCanvasGestures.ts";
import { bindCanvasRefLinks } from "./bindCanvasRefLinks.ts";
import { zoomCanvas } from "./canvasCommands.ts";
import { CanvasFrameToolButton } from "./CanvasFrameToolButton.tsx";
import { CanvasTagFrameControl } from "./CanvasTagFrameControl.tsx";
import { CanvasNoteSpawnButton } from "./CanvasNoteSpawnButton.tsx";
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
  const frames = useDocument((state) => state.frames);
  const framePlacements = useDocument((state) => state.framePlacements);
  const notes = useDocument((state) => state.notes);
  const notePlacements = useDocument((state) => state.notePlacements);
  const viewport = useDocument((state) => state.canvasViewport);
  const userSet = useDocument((state) => state.canvasViewportUserSet);
  const revealId = useDocument((state) => state.revealId);
  const canvasSelection = useDocument((state) => state.canvasSelection);
  const canvasTool = useDocument((state) => state.canvasTool);
  const tagFramePlacementTag = useDocument((state) => state.tagFramePlacementTag);
  const selectedSet = new Set(canvasSelection);
  const ids = sortedCardPlacementKeys(placements, items);
  const apIds = sortedActionPointPlacementIds(apPlacements, actionPoints).filter((id) => actionPoints[id]);
  const frameIds = sortedFramePlacementIdsForPaint(framePlacements, frames).filter((id) => frames[id]);
  const noteIds = sortedNotePlacementIds(notePlacements, notes).filter((id) => notes[id]);
  const cardZBase = frameIds.length + 1;
  const apZBase = cardZBase + ids.length;
  const noteZBase = apZBase + apIds.length;
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
    applyCanvasWorldScale(world, viewport.zoom);
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
    surface.scrollLeft = Math.min(Math.max(0, Math.round(left)), maxLeft);
    surface.scrollTop = Math.min(Math.max(0, Math.round(top)), maxTop);
  }, [viewport, userSet, ids.length, apIds.length, frameIds.length, noteIds.length]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    return bindCanvasGestures(surface, spawnGesture);
  }, []);

  useEffect(() => {
    const surface = surfaceRef.current;
    const on = canvasTool === "frame";
    surface?.classList.toggle("is-frame-tool", on);
    document.body.classList.toggle("canvas-frame-tool-active", on);
    return () => {
      surface?.classList.remove("is-frame-tool");
      document.body.classList.remove("canvas-frame-tool-active");
    };
  }, [canvasTool]);

  useEffect(() => {
    const surface = surfaceRef.current;
    const on = !!tagFramePlacementTag;
    surface?.classList.toggle("is-tag-frame-placement", on);
    return () => surface?.classList.remove("is-tag-frame-placement");
  }, [tagFramePlacementTag]);

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
                {ids.length === 0 && apIds.length === 0 && frameIds.length === 0 && noteIds.length === 0 && (
                  <p className="canvas-hint">Drag from the list · Q question · D decision · N note · F frame · Alt+drag duplicate · Shift+click to add · Space+pan · ⌘/Ctrl+scroll zoom</p>
                )}
                {frameIds.map((id, index) => {
                  const frame = frames[id];
                  const pos = framePlacements[id];
                  if (!frame || !pos) return null;
                  const hostRect = { x: pos.x, y: pos.y, width: pos.width, height: pos.height };
                  const occludersWorld = frameIds.slice(index + 1).flatMap((aboveId) => {
                    const p = framePlacements[aboveId];
                    return p ? [{ x: p.x, y: p.y, width: p.width, height: p.height }] : [];
                  });
                  const occludersLocal = localOccluderRectsForFrame(hostRect, occludersWorld);
                  return (
                    <div
                      key={id}
                      className={`canvas-placed-frame${revealId === id ? " is-canvas-reveal-pop" : ""}${selectedSet.has(id) ? " is-canvas-selected" : ""}`}
                      data-canvas-placed={id}
                      style={{ left: pos.x, top: pos.y, width: pos.width, height: pos.height, zIndex: index + 1 }}
                      onAnimationEnd={() => useDocument.getState().clearReveal()}
                    >
                      <FrameView
                        frame={frame}
                        width={pos.width}
                        height={pos.height}
                        surface="canvas"
                        occludersLocal={occludersLocal}
                      />
                    </div>
                  );
                })}
                {apIds.map((id, index) => {
                  const ap = actionPoints[id];
                  const pos = apPlacements[id];
                  if (!ap || !pos) return null;
                  return (
                    <div
                      key={id}
                      className={`canvas-placed-action-point${revealId === id ? " is-canvas-reveal-pop" : ""}${selectedSet.has(id) ? " is-canvas-selected" : ""}`}
                      data-canvas-placed={id}
                      style={{ left: pos.x, top: pos.y, zIndex: apZBase + index }}
                      onAnimationEnd={() => useDocument.getState().clearReveal()}
                    >
                      <ActionPointView actionPoint={ap} surface="canvas" />
                    </div>
                  );
                })}
                {noteIds.map((id, index) => {
                  const note = notes[id];
                  const pos = notePlacements[id];
                  if (!note || !pos) return null;
                  return (
                    <div
                      key={id}
                      className={`canvas-placed-note${revealId === id ? " is-canvas-reveal-pop" : ""}${selectedSet.has(id) ? " is-canvas-selected" : ""}`}
                      data-canvas-placed={id}
                      style={{
                        left: pos.x,
                        top: pos.y,
                        width: pos.width,
                        height: pos.height,
                        zIndex: noteZBase + index,
                      }}
                      onAnimationEnd={() => useDocument.getState().clearReveal()}
                    >
                      <NoteView note={note} width={pos.width} height={pos.height} surface="canvas" />
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
                      style={{ left: pos.x, top: pos.y, zIndex: cardZBase + index }}
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
      <div className="canvas-tool-bar" aria-label="Canvas tools">
        <CanvasFrameToolButton />
      </div>
      <div className="canvas-spawn-group" aria-label="Add to canvas">
        <CanvasSpawnButton
          intent="question"
          spawnGesture={spawnGesture}
          spawnAt={spawnAt}
          surfaceRef={surfaceRef}
          aria-label="New question — Q, click, or drag onto canvas"
          title="New question (Q, click, or drag)"
        >
          <IconCard />
        </CanvasSpawnButton>
        <CanvasSpawnButton
          intent="decision"
          spawnGesture={spawnGesture}
          spawnAt={spawnAt}
          surfaceRef={surfaceRef}
          aria-label="New decision — D, click, or drag onto canvas"
          title="New decision (D, click, or drag)"
        >
          <IconLightbulb />
        </CanvasSpawnButton>
        <CanvasTagFrameControl />
        <CanvasNoteSpawnButton spawnGesture={spawnGesture} spawnAt={spawnAt} surfaceRef={surfaceRef}>
          <IconStickyNote />
        </CanvasNoteSpawnButton>
      </div>
      <div className="canvas-zoom-controls" aria-label="Canvas zoom">
        <button type="button" className="canvas-zoom-btn" data-action="canvas-zoom-out" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.15)}>−</button>
        <button type="button" className="canvas-zoom-btn canvas-zoom-btn--label" data-action="canvas-zoom-reset" aria-label="Reset zoom to 100%" onClick={() => useDocument.getState().setViewport({ ...useDocument.getState().canvasViewport, zoom: 1 })}>{pct}%</button>
        <button type="button" className="canvas-zoom-btn" data-action="canvas-zoom-in" aria-label="Zoom in" onClick={() => zoomBy(1.15)}>+</button>
      </div>
    </>
  );
}
