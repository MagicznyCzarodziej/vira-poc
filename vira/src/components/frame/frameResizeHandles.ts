import type { FrameResizeHandle } from "../../domain/index.ts";

export const FRAME_RESIZE_HANDLES: FrameResizeHandle[] = [
  "n",
  "ne",
  "e",
  "se",
  "s",
  "sw",
  "w",
  "nw",
];

export function parseFrameResizeHandle(value: string | null | undefined): FrameResizeHandle | null {
  if (!value) return null;
  return FRAME_RESIZE_HANDLES.includes(value as FrameResizeHandle) ? value as FrameResizeHandle : null;
}
