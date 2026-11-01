import { describe, expect, it } from "vitest";
import {
  cardPlacementKeysInDragGroup,
  remapCanvasDragGroupForAltDuplicate,
} from "./canvasAltDuplicateDrag.ts";

describe("cardPlacementKeysInDragGroup", () => {
  it("keeps card placement keys and drops action points", () => {
    const state = {
      items: { "item-1": { id: "item-1" } },
      actionPoints: { "ap-1": { id: "ap-1", title: "T", done: false } },
      canvasPlacements: {
        "canvas-1": { x: 0, y: 0, itemId: "item-1" },
        "canvas-2": { x: 1, y: 1, itemId: "item-1" },
      },
    };
    expect(cardPlacementKeysInDragGroup(state, ["canvas-1", "ap-1", "canvas-2", "missing"])).toEqual([
      "canvas-1",
      "canvas-2",
    ]);
  });
});

describe("remapCanvasDragGroupForAltDuplicate", () => {
  it("remaps group ids and start positions through a key map", () => {
    const { groupIds, groupStart } = remapCanvasDragGroupForAltDuplicate(
      ["canvas-1", "ap-1"],
      { "canvas-1": { x: 10, y: 20 } },
      { "canvas-1": "canvas-2" },
    );
    expect(groupIds).toEqual(["canvas-2", "ap-1"]);
    expect(groupStart).toEqual({ "canvas-2": { x: 10, y: 20 } });
  });
});
