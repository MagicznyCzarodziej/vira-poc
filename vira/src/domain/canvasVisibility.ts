import type { FrameRect } from "./frameCanvas.ts";

export type ViewportWorldRect = {
  scrollLeft: number;
  scrollTop: number;
  zoom: number;
  clientWidth: number;
  clientHeight: number;
  /** Extra margin in screen pixels, converted to world space. */
  marginScreenPx?: number;
};

export type WorldBounds = { x: number; y: number; width: number; height: number };

export function viewportWorldBounds(view: ViewportWorldRect): { left: number; top: number; right: number; bottom: number } {
  const margin = (view.marginScreenPx ?? 0) / view.zoom;
  const left = view.scrollLeft / view.zoom - margin;
  const top = view.scrollTop / view.zoom - margin;
  const right = (view.scrollLeft + view.clientWidth) / view.zoom + margin;
  const bottom = (view.scrollTop + view.clientHeight) / view.zoom + margin;
  return { left, top, right, bottom };
}

export function boundsIntersectViewport(
  bounds: WorldBounds,
  view: ViewportWorldRect,
): boolean {
  const vp = viewportWorldBounds(view);
  return !(
    bounds.x + bounds.width < vp.left
    || bounds.x > vp.right
    || bounds.y + bounds.height < vp.top
    || bounds.y > vp.bottom
  );
}

export function isPointPlacementVisible(
  x: number,
  y: number,
  view: ViewportWorldRect,
  width = 320,
  height = 120,
): boolean {
  return boundsIntersectViewport({ x, y, width, height }, view);
}

export function isFramePlacementVisible(rect: FrameRect, view: ViewportWorldRect): boolean {
  return boundsIntersectViewport(rect, view);
}
