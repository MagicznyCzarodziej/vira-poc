import { describe, expect, it } from "vitest";
import {
  FRAME_DEFAULT_HEIGHT,
  FRAME_DEFAULT_WIDTH,
  FRAME_MIN_WIDTH,
  clampFrameSize,
  placeFrameAtWorld,
  resizeFrameAtWorld,
  resizeFrameRectFromDrag,
} from "./frameCanvas.ts";
import { createFrame } from "./frames.ts";
import type { FramePlacement } from "./types.ts";

describe("frameCanvas", () => {
  it("places a frame with default size", () => {
    const bag = { nextFrameId: 1, frames: {} };
    const frame = createFrame(bag, "Sprint");
    const placements: Record<string, FramePlacement> = {};
    placeFrameAtWorld(placements, bag.frames, frame.id, 100, 80);
    expect(placements[frame.id]).toMatchObject({
      x: 100,
      y: 80,
      width: FRAME_DEFAULT_WIDTH,
      height: FRAME_DEFAULT_HEIGHT,
    });
  });

  it("resizes from the west edge by moving x and width", () => {
    const start = { x: 200, y: 100, width: 400, height: 300 };
    const next = resizeFrameRectFromDrag(start, "w", 50, 0);
    expect(next.x).toBe(250);
    expect(next.width).toBe(350);
    expect(next.height).toBe(300);
  });

  it("resizes from the north edge by moving y and height", () => {
    const start = { x: 100, y: 200, width: 400, height: 300 };
    const next = resizeFrameRectFromDrag(start, "n", 0, 40);
    expect(next.y).toBe(240);
    expect(next.height).toBe(260);
  });

  it("enforces minimum width when dragging the west handle", () => {
    const start = { x: 100, y: 50, width: 250, height: 200 };
    const next = resizeFrameRectFromDrag(start, "w", 200, 0);
    expect(next.width).toBe(FRAME_MIN_WIDTH);
    expect(next.x).toBe(start.x + start.width - FRAME_MIN_WIDTH);
  });

  it("clamps resize to minimum dimensions", () => {
    const bag = { nextFrameId: 1, frames: {} };
    const frame = createFrame(bag);
    const placements: Record<string, FramePlacement> = {
      [frame.id]: { x: 0, y: 0, width: FRAME_DEFAULT_WIDTH, height: FRAME_DEFAULT_HEIGHT },
    };
    resizeFrameAtWorld(placements, bag.frames, frame.id, 50, 40);
    const size = clampFrameSize(50, 40);
    expect(placements[frame.id]!.width).toBe(size.width);
    expect(placements[frame.id]!.height).toBe(size.height);
  });
});
