import { describe, expect, it } from "vitest";
import {
  CANVAS_CARD_EST_HEIGHT,
  canvasPlacementIdsInsideFrame,
  distancePointToFrameBorder,
  expandCanvasDragGroupWithFrameContents,
  pickFrameIdAtWorldPoint,
  pointInsideFrame,
  placementCenterInWorld,
} from "./canvasFrameContainment.ts";
import { CARD_WIDTH } from "../../domain/constants.ts";

describe("canvasFrameContainment", () => {
  const frame = { x: 100, y: 100, width: 600, height: 400 };

  it("detects center point inside frame bounds", () => {
    expect(pointInsideFrame(200, 200, frame)).toBe(true);
    expect(pointInsideFrame(50, 200, frame)).toBe(false);
  });

  it("lists card and action placements inside a frame", () => {
    const cardCenter = { x: 200, y: 200 };
    const cardPos = {
      x: cardCenter.x - CARD_WIDTH / 2,
      y: cardCenter.y - CANVAS_CARD_EST_HEIGHT / 2,
    };
    const state = {
      items: { "item-1": { id: "item-1", tags: [], archivedAt: null, steps: [] } },
      frames: {},
      framePlacements: {},
      canvasPlacements: {
        "canvas-1": { x: cardPos.x, y: cardPos.y, itemId: "item-1" },
        "canvas-2": { x: 900, y: 900, itemId: "item-1" },
      },
      actionPointPlacements: {
        "ap-1": { x: 150, y: 150 },
      },
      actionPoints: {
        "ap-1": { id: "ap-1", title: "T", done: false, doneAt: null, createdAt: "" },
      },
    };
    const inside = canvasPlacementIdsInsideFrame(state, frame);
    expect(inside).toContain("canvas-1");
    expect(inside).toContain("ap-1");
    expect(inside).not.toContain("canvas-2");
  });

  it("expands a frame drag group to contained placements", () => {
    const state = {
      items: { "item-1": { id: "item-1", tags: [], archivedAt: null, steps: [] } },
      frames: { "frame-1": { id: "frame-1", title: "F", createdAt: "" } },
      framePlacements: {
        "frame-1": { x: 100, y: 100, width: 600, height: 400 },
      },
      canvasPlacements: {
        "canvas-1": {
          x: 200 - CARD_WIDTH / 2,
          y: 200 - CANVAS_CARD_EST_HEIGHT / 2,
          itemId: "item-1",
        },
      },
      actionPointPlacements: {},
      actionPoints: {},
    };
    const groupStart: Record<string, { x: number; y: number }> = {
      "frame-1": { x: 100, y: 100 },
    };
    const expanded = expandCanvasDragGroupWithFrameContents(state, ["frame-1"], groupStart);
    expect(expanded).toEqual(["frame-1", "canvas-1"]);
    expect(groupStart["canvas-1"]).toBeDefined();
  });

  it("picks the frame whose border is closest to the cursor", () => {
    const placements = {
      "frame-outer": { x: 0, y: 0, width: 800, height: 600 },
      "frame-inner": { x: 200, y: 150, width: 300, height: 200 },
    };
    const frames = {
      "frame-outer": { id: "frame-outer" },
      "frame-inner": { id: "frame-inner" },
    };
    expect(pickFrameIdAtWorldPoint(placements, frames, 350, 250)).toBe("frame-inner");
    expect(pickFrameIdAtWorldPoint(placements, frames, 50, 50)).toBe("frame-outer");
    expect(distancePointToFrameBorder(350, 250, { x: 200, y: 150, width: 300, height: 200 })).toBe(100);
  });

  it("does not treat nested frames as contents when dragging a frame", () => {
    const state = {
      items: {},
      frames: {
        "frame-1": { id: "frame-1", title: "Outer", createdAt: "" },
        "frame-2": { id: "frame-2", title: "Inner", createdAt: "" },
      },
      framePlacements: {
        "frame-1": { x: 0, y: 0, width: 800, height: 600 },
        "frame-2": { x: 200, y: 150, width: 300, height: 200 },
      },
      canvasPlacements: {},
      actionPointPlacements: {},
      actionPoints: {},
    };
    const groupStart: Record<string, { x: number; y: number }> = {
      "frame-1": { x: 0, y: 0 },
    };
    expect(expandCanvasDragGroupWithFrameContents(state, ["frame-1"], groupStart)).toEqual(["frame-1"]);
    expect(
      canvasPlacementIdsInsideFrame(state, { x: 0, y: 0, width: 800, height: 600 }, { frameHostId: "frame-1" }),
    ).toEqual([]);
  });

  it("computes placement center from top-left", () => {
    const c = placementCenterInWorld({ x: 10, y: 20 }, "card");
    expect(c.x).toBe(10 + CARD_WIDTH / 2);
  });
});
