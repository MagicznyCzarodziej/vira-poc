import { describe, expect, it } from "vitest";
import {
  addCardInstanceToCanvas,
  canvasPlacementKeysForItem,
  duplicateCardPlacements,
} from "./cardCanvasPlacements.ts";
import { placeAtWorld } from "./cards.ts";
import { normalizeStep } from "./steps.ts";
import type { DocBag } from "./types.ts";

function bag(): DocBag {
  return {
    nextId: 2,
    nextCanvasPlacementId: 1,
    items: {
      "item-1": {
        id: "item-1",
        tags: [],
        archivedAt: null,
        steps: [normalizeStep({ problem: "Q?", answer: "A" })],
      },
    },
    canvasPlacements: {},
  };
}

describe("cardCanvasPlacements", () => {
  it("allows multiple canvas instances of the same card", () => {
    const state = bag();
    const first = placeAtWorld(state, "item-1", 10, 20);
    const second = placeAtWorld(state, "item-1", 100, 120);
    expect(first).toMatch(/^canvas-/);
    expect(second).toMatch(/^canvas-/);
    expect(first).not.toBe(second);
    expect(state.canvasPlacements[first!]?.itemId).toBe("item-1");
    expect(state.canvasPlacements[second!]?.itemId).toBe("item-1");
    expect(canvasPlacementKeysForItem(state.canvasPlacements, state.items, "item-1")).toHaveLength(2);
  });

  it("duplicates placements at requested positions", () => {
    const state = bag();
    const original = placeAtWorld(state, "item-1", 10, 20)!;
    const map = duplicateCardPlacements(state, [original], (key) =>
      key === original ? { x: 10, y: 20 } : null,
    );
    const copy = map[original];
    expect(copy).toMatch(/^canvas-/);
    expect(copy).not.toBe(original);
    expect(state.canvasPlacements[original]).toEqual({ x: 10, y: 20, itemId: "item-1", order: expect.any(String) });
    expect(state.canvasPlacements[copy!]?.itemId).toBe("item-1");
    expect(canvasPlacementKeysForItem(state.canvasPlacements, state.items, "item-1")).toHaveLength(2);
  });

  it("uses item id as the first placement key for a new card", () => {
    const state = bag();
    const key = addCardInstanceToCanvas(state, "item-1", 5, 5, { useItemIdAsKey: true });
    expect(key).toBe("item-1");
    expect(state.canvasPlacements["item-1"]?.itemId).toBe("item-1");
  });
});
