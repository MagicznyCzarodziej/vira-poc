import { describe, expect, it } from "vitest";
import {
  canvasWorldPlacement,
  isCanvasActionPointId,
  partitionCanvasMoves,
} from "./canvasPlaced.ts";

describe("canvasPlaced", () => {
  const state = {
    actionPoints: { "ap-1": { id: "ap-1", title: "Go", done: false } },
    frames: { "frame-1": { id: "frame-1", title: "Area", createdAt: "" } },
    canvasPlacements: { "item-1": { x: 10, y: 20, order: 0 } },
    actionPointPlacements: { "ap-1": { x: 30, y: 40, order: 0 } },
    framePlacements: { "frame-1": { x: 50, y: 60, width: 400, height: 300, order: 0 } },
  };

  it("reads card and action placements", () => {
    expect(canvasWorldPlacement(state, "item-1")).toEqual({ x: 10, y: 20, order: 0 });
    expect(canvasWorldPlacement(state, "ap-1")).toEqual({ x: 30, y: 40, order: 0 });
    expect(canvasWorldPlacement(state, "frame-1")).toEqual({ x: 50, y: 60 });
    expect(canvasWorldPlacement(state, "missing")).toBeNull();
  });

  it("partitions drag moves by entity type", () => {
    const moves = [
      { id: "item-1", x: 1, y: 2 },
      { id: "ap-1", x: 3, y: 4 },
      { id: "frame-1", x: 5, y: 6 },
    ];
    expect(partitionCanvasMoves(state, moves)).toEqual({
      cardMoves: [{ id: "item-1", x: 1, y: 2 }],
      actionPointMoves: [{ id: "ap-1", x: 3, y: 4 }],
      frameMoves: [{ id: "frame-1", x: 5, y: 6 }],
    });
    expect(isCanvasActionPointId(state, "ap-1")).toBe(true);
    expect(isCanvasActionPointId(state, "item-1")).toBe(false);
  });
});
