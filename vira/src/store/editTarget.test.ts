import { describe, expect, it } from "vitest";
import { isCanvasPlacementEditing, sameEditTarget } from "./editTarget.ts";

describe("sameEditTarget", () => {
  it("treats canvas placements as distinct when keys differ", () => {
    const base = { id: "item-1", field: "problem" as const, step: 0, surface: "canvas" as const };
    expect(
      sameEditTarget(
        { ...base, canvasPlacementKey: "item-1" },
        { ...base, canvasPlacementKey: "canvas-2" },
      ),
    ).toBe(false);
  });

  it("matches when canvas placement keys are both absent", () => {
    const a = { id: "item-1", field: "answer" as const, step: 0, surface: "list" as const };
    expect(sameEditTarget(a, { ...a })).toBe(true);
  });
});

describe("isCanvasPlacementEditing", () => {
  it("is true only for the matching placement host", () => {
    const editing = {
      id: "item-1",
      field: "answer" as const,
      step: 0,
      surface: "canvas" as const,
      canvasPlacementKey: "canvas-2",
    };
    expect(isCanvasPlacementEditing(editing, "item-1", "canvas-2", "answer", 0)).toBe(true);
    expect(isCanvasPlacementEditing(editing, "item-1", "item-1", "answer", 0)).toBe(false);
    expect(isCanvasPlacementEditing(null, "item-1", "canvas-2", "answer", 0)).toBe(false);
  });
});
