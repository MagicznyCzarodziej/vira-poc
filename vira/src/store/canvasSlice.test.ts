// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "./useDocument.ts";

describe("toggleCanvasSelection", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("adds and removes ids from canvas selection", () => {
    useDocument.getState().toggleCanvasSelection("item-1");
    expect(useDocument.getState().canvasSelection).toEqual(["item-1"]);
    useDocument.getState().toggleCanvasSelection("item-2");
    expect(useDocument.getState().canvasSelection).toEqual(["item-1", "item-2"]);
    useDocument.getState().toggleCanvasSelection("item-1");
    expect(useDocument.getState().canvasSelection).toEqual(["item-2"]);
  });
});

describe("removeCanvasSelectionFromCanvas", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
    useDocument.getState().submitComposer("One", "decision");
    const id1 = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().submitComposer("Two", "decision");
    const id2 = Object.keys(useDocument.getState().items).find((id) => id !== id1)!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(id1, 100, 100);
    useDocument.getState().placeNewCardAtWorld(id2, 200, 200);
    const placements = useDocument.getState().canvasPlacements;
    const key1 = Object.keys(placements)[0]!;
    const key2 = Object.keys(placements).find((k) => k !== key1)!;
    useDocument.getState().setCanvasSelection([key1, key2]);
  });

  it("removes all selected placements and clears selection", () => {
    const before = useDocument.getState();
    const keys = before.canvasSelection;
    const itemIds = keys.map((k) => before.canvasPlacements[k]!.itemId);
    useDocument.getState().removeCanvasSelectionFromCanvas();
    const next = useDocument.getState();
    for (const key of keys) expect(next.canvasPlacements[key]).toBeUndefined();
    expect(next.canvasSelection).toEqual([]);
    for (const itemId of itemIds) expect(next.items[itemId]).toBeDefined();
  });

  it("no-ops when nothing is selected", () => {
    const keys = Object.keys(useDocument.getState().canvasPlacements).sort();
    useDocument.getState().clearCanvasSelection();
    useDocument.getState().removeCanvasSelectionFromCanvas();
    expect(Object.keys(useDocument.getState().canvasPlacements).sort()).toEqual(keys);
  });

  it("removes only the selected placement when selection is partial", () => {
    const [key1, key2] = useDocument.getState().canvasSelection;
    useDocument.getState().setCanvasSelection([key1!]);
    useDocument.getState().removeCanvasSelectionFromCanvas();
    const next = useDocument.getState();
    expect(next.canvasPlacements[key1!]).toBeUndefined();
    expect(next.canvasPlacements[key2!]).toBeDefined();
    expect(next.canvasSelection).toEqual([]);
  });

  it("allows a second canvas instance of the same card", () => {
    const itemId = Object.values(useDocument.getState().canvasPlacements)[0]!.itemId;
    useDocument.getState().placeAtWorld(itemId, 300, 300);
    const keys = Object.keys(useDocument.getState().canvasPlacements).filter(
      (key) => useDocument.getState().canvasPlacements[key]?.itemId === itemId,
    );
    expect(keys.length).toBeGreaterThanOrEqual(2);
  });

  it("drops removed ids from selection via removeFromCanvas", () => {
    const [key1, key2] = useDocument.getState().canvasSelection;
    useDocument.getState().setCanvasSelection([key1!, key2!]);
    useDocument.getState().removeFromCanvas(key1!);
    expect(useDocument.getState().canvasSelection).toEqual([key2]);
  });

  it("removes selected action points from the canvas", () => {
    const apId = useDocument.getState().createStandaloneActionPoint("Ship");
    useDocument.getState().cancelEdit();
    useDocument.getState().placeActionPointAtWorld(apId, 50, 60);
    useDocument.getState().setCanvasSelection([apId]);
    useDocument.getState().removeCanvasSelectionFromCanvas();
    const next = useDocument.getState();
    expect(next.actionPointPlacements[apId]).toBeUndefined();
    expect(next.actionPoints[apId]?.title).toBe("Ship");
    expect(next.canvasSelection).toEqual([]);
  });
});
