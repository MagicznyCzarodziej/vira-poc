import {
  FRAME_MIN_HEIGHT,
  FRAME_MIN_WIDTH,
  clampFramePlacement,
  type FrameRect,
} from "../../domain/index.ts";
import { shouldStartCanvasMarquee } from "./canvasMarquee.ts";

export function worldPointFromClient(
  surface: HTMLElement,
  clientX: number,
  clientY: number,
  zoom: number,
): { x: number; y: number } {
  const rect = surface.getBoundingClientRect();
  return {
    x: (surface.scrollLeft + clientX - rect.left) / zoom,
    y: (surface.scrollTop + clientY - rect.top) / zoom,
  };
}

export function normalizeWorldRect(x1: number, y1: number, x2: number, y2: number): FrameRect {
  const left = Math.min(x1, x2);
  const top = Math.min(y1, y2);
  const right = Math.max(x1, x2);
  const bottom = Math.max(y1, y2);
  return {
    x: left,
    y: top,
    width: Math.max(0, right - left),
    height: Math.max(0, bottom - top),
  };
}

export function frameRectFromClientDrag(
  surface: HTMLElement,
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
  zoom: number,
): FrameRect {
  const a = worldPointFromClient(surface, startX, startY, zoom);
  const b = worldPointFromClient(surface, clientX, clientY, zoom);
  return normalizeWorldRect(a.x, a.y, b.x, b.y);
}

export function shouldStartFrameDraw(
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
): boolean {
  return shouldStartCanvasMarquee(startX, startY, clientX, clientY);
}

export function frameDrawMeetsMinimum(rect: FrameRect): boolean {
  return rect.width >= FRAME_MIN_WIDTH && rect.height >= FRAME_MIN_HEIGHT;
}

export function clampFrameDrawRect(rect: FrameRect): FrameRect {
  return clampFramePlacement(rect.x, rect.y, rect.width, rect.height);
}
