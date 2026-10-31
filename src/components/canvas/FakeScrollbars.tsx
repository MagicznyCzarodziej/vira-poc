import { useEffect, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { useDocument } from "../../store/useDocument.ts";
import { axisMetrics, unionBounds, type Axis } from "./scrollbarMetrics.ts";

const FADE_MS = 280;

export function FakeScrollbars({ surfaceRef }: { surfaceRef: RefObject<HTMLDivElement | null> }) {
  const placements = useDocument((state) => state.canvasPlacements);
  const viewport = useDocument((state) => state.canvasViewport);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [geom, setGeom] = useState({ showV: false, showH: false, vH: 16, vY: 0, hW: 16, hX: 0 });
  const [mounted, setMounted] = useState({ v: false, h: false });
  const [visible, setVisible] = useState({ v: false, h: false });
  const [dragging, setDragging] = useState<Axis | null>(null);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const watch = new ResizeObserver(() => setBox({ w: surface.clientWidth, h: surface.clientHeight }));
    watch.observe(surface);
    return () => watch.disconnect();
  }, [surfaceRef]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface || box.w < 2 || box.h < 2) return;
    const bounds = unionBounds(surface, placements);
    if (!bounds) {
      setGeom({ showV: false, showH: false, vH: 16, vY: 0, hW: 16, hX: 0 });
      return;
    }
    const v = axisMetrics("v", surface, bounds, viewport.zoom, viewport.scrollLeft, viewport.scrollTop);
    const h = axisMetrics("h", surface, bounds, viewport.zoom, viewport.scrollLeft, viewport.scrollTop);
    const vTrack =  Math.max(1, surface.clientHeight - 28 - (h.show ? 9 : 0));
    const hTrack = Math.max(1, surface.clientWidth - 28 - (v.show ? 9 : 0));
    const vThumb = Math.max(16, Math.min(vTrack, Math.round(vTrack * v.thumbFrac)));
    const hThumb = Math.max(16, Math.min(hTrack, Math.round(hTrack * h.thumbFrac)));
    const vRatio = v.panSpan > 0 ? Math.max(0, Math.min(1, (v.scrollPx - v.scrollPanMin) / v.panSpan)) : 0;
    const hRatio = h.panSpan > 0 ? Math.max(0, Math.min(1, (h.scrollPx - h.scrollPanMin) / h.panSpan)) : 0;
    setGeom({
      showV: v.show,
      showH: h.show,
      vH: vThumb,
      vY: vRatio * Math.max(1, vTrack - vThumb),
      hW: hThumb,
      hX: hRatio * Math.max(1, hTrack - hThumb),
    });
  }, [box.h, box.w, placements, surfaceRef, viewport.scrollLeft, viewport.scrollTop, viewport.zoom]);

  useEffect(() => {
    setMounted((current) => ({ v: current.v || geom.showV, h: current.h || geom.showH }));
    setVisible({ v: geom.showV, h: geom.showH });
    if (geom.showV && geom.showH) return;
    const timer = window.setTimeout(() => {
      setMounted((current) => ({ v: geom.showV ? current.v : false, h: geom.showH ? current.h : false }));
    }, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [geom.showH, geom.showV]);

  const startDrag = (axis: Axis, event: ReactPointerEvent<HTMLDivElement>) => {
    const surface = surfaceRef.current;
    if (!surface || event.button !== 0) return;
    const bounds = unionBounds(surface, useDocument.getState().canvasPlacements);
    if (!bounds) return;
    const view = useDocument.getState().canvasViewport;
    const met = axisMetrics(axis, surface, bounds, view.zoom, view.scrollLeft, view.scrollTop);
    if (!met.show || met.panSpan <= 0) return;
    const track = event.currentTarget;
    const thumb = track.querySelector<HTMLElement>(".canvas-fake-scrollbar-thumb");
    if (!thumb) return;
    const trackRect = track.getBoundingClientRect();
    const thumbRect = thumb.getBoundingClientRect();
    const trackSize = axis === "v" ? trackRect.height : trackRect.width;
    const thumbSize = axis === "v" ? thumbRect.height : thumbRect.width;
    const travel = Math.max(1, trackSize - thumbSize);
    const pointer = axis === "v" ? event.clientY : event.clientX;
    const origin = axis === "v" ? trackRect.top : trackRect.left;
    if (event.target === track) {
      const ratio = Math.max(0, Math.min(1, (pointer - origin - thumbSize / 2) / travel));
      const next = met.scrollPanMin + ratio * met.panSpan;
      const current = useDocument.getState().canvasViewport;
      useDocument.getState().setViewport(axis === "v" ? { ...current, scrollTop: next } : { ...current, scrollLeft: next });
    }
    const startScroll = axis === "v" ? surface.scrollTop : surface.scrollLeft;
    setDragging(axis);
    const move = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== event.pointerId) return;
      const delta = (axis === "v" ? pointerEvent.clientY : pointerEvent.clientX) - pointer;
      const next = Math.max(met.scrollPanMin, Math.min(met.scrollPanMax, startScroll + (delta / travel) * met.panSpan));
      const current = useDocument.getState().canvasViewport;
      useDocument.getState().setViewport(axis === "v" ? { ...current, scrollTop: next } : { ...current, scrollLeft: next });
    };
    const end = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== event.pointerId) return;
      setDragging(null);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    event.preventDefault();
    event.stopPropagation();
  };

  const any = mounted.v || mounted.h;
  return (
    <div
      className={`canvas-fake-scrollbars${geom.showV || dragging === "v" ? " has-v" : ""}${geom.showH || dragging === "h" ? " has-h" : ""}${dragging ? " is-dragging" : ""}`}
      data-canvas-fake-scrollbars
      hidden={!any}
      aria-hidden={any ? "false" : "true"}
    >
      {mounted.v && (
        <div className={`canvas-fake-scrollbar canvas-fake-scrollbar--v${visible.v || dragging === "v" ? " is-visible" : ""}`} data-canvas-scrollbar-v>
          <div className="canvas-fake-scrollbar-track" data-canvas-scrollbar-v-track onPointerDown={(event) => startDrag("v", event)}>
            <div className="canvas-fake-scrollbar-thumb" data-canvas-scrollbar-v-thumb style={{ height: geom.vH, transform: `translateY(${geom.vY}px)` }} />
          </div>
        </div>
      )}
      {mounted.h && (
        <div className={`canvas-fake-scrollbar canvas-fake-scrollbar--h${visible.h || dragging === "h" ? " is-visible" : ""}`} data-canvas-scrollbar-h>
          <div className="canvas-fake-scrollbar-track" data-canvas-scrollbar-h-track onPointerDown={(event) => startDrag("h", event)}>
            <div className="canvas-fake-scrollbar-thumb" data-canvas-scrollbar-h-thumb style={{ width: geom.hW, transform: `translateX(${geom.hX}px)` }} />
          </div>
        </div>
      )}
    </div>
  );
}
