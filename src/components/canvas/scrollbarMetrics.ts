import { WORLD_H, WORLD_W, type Placement } from "../../domain/index.ts";
import { placedCardBounds, type WorldBounds } from "./flyToCard.ts";

export type Axis = "v" | "h";

export type AxisMetrics = {
  show: boolean;
  panSpan: number;
  scrollPanMin: number;
  scrollPanMax: number;
  thumbFrac: number;
  scrollPx: number;
};

export function unionBounds(surface: HTMLElement, placements: Record<string, Placement>): WorldBounds | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  for (const [id, placement] of Object.entries(placements)) {
    const el = surface.querySelector<HTMLElement>(`[data-canvas-placed="${id}"]`);
    if (!el && !placement) continue;
    const bounds = placedCardBounds(placement, el);
    any = true;
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }
  return any ? { minX, minY, maxX, maxY } : null;
}

export function axisMetrics(axis: Axis, surface: HTMLElement, bounds: WorldBounds, zoom: number, scrollLeft: number, scrollTop: number): AxisMetrics {
  const isV = axis === "v";
  const client = isV ? surface.clientHeight : surface.clientWidth;
  const scaled = Math.ceil((isV ? WORLD_H : WORLD_W) * zoom);
  const maxScroll = Math.max(0, scaled - client);
  const viewStart = (isV ? scrollTop : scrollLeft) / zoom;
  const viewEnd = viewStart + client / zoom;
  const contentMin = isV ? bounds.minY : bounds.minX;
  const contentMax = isV ? bounds.maxY : bounds.maxX;
  const outside = Math.max(0, viewStart - contentMin) + Math.max(0, contentMax - viewEnd);
  const scrollPx = isV ? scrollTop : scrollLeft;
  if (outside <= 0 || maxScroll <= 1) {
    return { show: false, panSpan: 0, scrollPanMin: 0, scrollPanMax: 0, thumbFrac: 1, scrollPx };
  }
  const viewWorld = client / zoom;
  const thumbFrac = viewWorld / (viewWorld + outside);
  const scrollPanMin = Math.max(0, (contentMin - viewWorld) * zoom);
  const scrollPanMax = Math.min(maxScroll, contentMax * zoom);
  let panSpan = Math.max(0, scrollPanMax - scrollPanMin);
  if (panSpan < 1) panSpan = maxScroll;
  return { show: true, panSpan, scrollPanMin, scrollPanMax, thumbFrac, scrollPx };
}
