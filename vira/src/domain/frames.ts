import type { Frame } from "./types.ts";

export type FrameBag = {
  nextFrameId: number;
  frames: Record<string, Frame>;
};

export function recomputeNextFrameId(frames: Record<string, Frame>): number {
  let max = 0;
  for (const id of Object.keys(frames)) {
    const match = id.match(/^frame-(\d+)$/i);
    if (match) max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
  }
  return max + 1;
}

export function createFrame(bag: FrameBag, title = "Frame", now = new Date().toISOString()): Frame {
  const id = `frame-${bag.nextFrameId}`;
  bag.nextFrameId += 1;
  const frame: Frame = {
    id,
    title: title.trim() || "Frame",
    createdAt: now,
  };
  bag.frames[id] = frame;
  return frame;
}
