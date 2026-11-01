// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "./useDocument.ts";

describe("removeCanvasSelectionFromCanvas", () => {
  beforeEach(() => {
    const state = useDocument.getState();
    state.placeNewCardAtWorld("item-1", 100, 100);
    state.placeNewCardAtWorld("item-2", 200, 200);
    state.setCanvasSelection(["item-1", "item-2"]);
  });

  it("removes all selected placements and clears selection", () => {
    useDocument.getState().removeCanvasSelectionFromCanvas();
    const next = useDocument.getState();
    expect(next.canvasPlacements["item-1"]).toBeUndefined();
    expect(next.canvasPlacements["item-2"]).toBeUndefined();
    expect(next.canvasSelection).toEqual([]);
    expect(next.items["item-1"]).toBeDefined();
    expect(next.items["item-2"]).toBeDefined();
  });

  it("no-ops when nothing is selected", () => {
    useDocument.getState().clearCanvasSelection();
    useDocument.getState().removeCanvasSelectionFromCanvas();
    expect(Object.keys(useDocument.getState().canvasPlacements)).toEqual(["item-1", "item-2"]);
  });

  it("removes only the selected placement when selection is partial", () => {
    useDocument.getState().setCanvasSelection(["item-1"]);
    useDocument.getState().removeCanvasSelectionFromCanvas();
    const next = useDocument.getState();
    expect(next.canvasPlacements["item-1"]).toBeUndefined();
    expect(next.canvasPlacements["item-2"]).toBeDefined();
    expect(next.canvasSelection).toEqual([]);
  });

  it("allows a second canvas instance of the same card", () => {
    useDocument.getState().placeAtWorld("item-1", 300, 300);
    const keys = Object.keys(useDocument.getState().canvasPlacements).filter(
      (key) => useDocument.getState().canvasPlacements[key]?.itemId === "item-1",
    );
    expect(keys.length).toBeGreaterThanOrEqual(2);
  });

  it("drops removed ids from selection via removeFromCanvas", () => {
    useDocument.getState().setCanvasSelection(["item-1", "item-2"]);
    useDocument.getState().removeFromCanvas("item-1");
    expect(useDocument.getState().canvasSelection).toEqual(["item-2"]);
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
