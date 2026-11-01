import { describe, expect, it } from "vitest";
import { FRAME_MIN_HEIGHT, FRAME_MIN_WIDTH } from "../../domain/index.ts";
import { frameDrawMeetsMinimum, normalizeWorldRect } from "./canvasFrameDraw.ts";

describe("normalizeWorldRect", () => {
  it("orders corners into x/y/width/height", () => {
    expect(normalizeWorldRect(100, 80, 40, 20)).toEqual({ x: 40, y: 20, width: 60, height: 60 });
  });
});

describe("frameDrawMeetsMinimum", () => {
  it("requires at least frame minimum size", () => {
    expect(frameDrawMeetsMinimum({ x: 0, y: 0, width: FRAME_MIN_WIDTH, height: FRAME_MIN_HEIGHT })).toBe(true);
    expect(frameDrawMeetsMinimum({ x: 0, y: 0, width: FRAME_MIN_WIDTH - 1, height: FRAME_MIN_HEIGHT })).toBe(false);
  });
});
