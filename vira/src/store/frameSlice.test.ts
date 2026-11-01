// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { FRAME_DEFAULT_WIDTH } from "../domain/index.ts";
import { useDocument } from "./useDocument.ts";

describe("frameSlice", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("creates a frame with explicit bounds", () => {
    const id = useDocument.getState().createFrameWithBoundsOnCanvas({
      x: 40,
      y: 50,
      width: 320,
      height: 240,
    });
    const placement = useDocument.getState().framePlacements[id]!;
    expect(placement.x).toBe(40);
    expect(placement.y).toBe(50);
    expect(placement.width).toBe(320);
    expect(placement.height).toBe(240);
  });

  it("creates a frame on the canvas with placement and selection", () => {
    const id = useDocument.getState().createFrameOnCanvas(120, 80, "Sprint");
    expect(id).toMatch(/^frame-/);
    expect(useDocument.getState().frames[id]?.title).toBe("Sprint");
    expect(useDocument.getState().framePlacements[id]).toMatchObject({
      x: 120,
      y: 80,
      width: FRAME_DEFAULT_WIDTH,
    });
    expect(useDocument.getState().canvasSelection).toEqual([id]);
  });

  it("removes selected frames from canvas and document", () => {
    const id = useDocument.getState().createFrameOnCanvas(10, 10);
    useDocument.getState().setCanvasSelection([id]);
    useDocument.getState().removeCanvasSelectionFromCanvas();
    expect(useDocument.getState().frames[id]).toBeUndefined();
    expect(useDocument.getState().framePlacements[id]).toBeUndefined();
  });
});
