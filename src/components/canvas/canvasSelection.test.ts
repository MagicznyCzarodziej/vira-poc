import { describe, expect, it } from "vitest";
import { mergeMarqueeSelection, resolveCanvasDragGroup } from "./canvasSelection.ts";

describe("resolveCanvasDragGroup", () => {
  it("drags the whole selection when the handle card is selected", () => {
    expect(resolveCanvasDragGroup(["item-1", "item-2", "item-3"], "item-2")).toEqual([
      "item-1",
      "item-2",
      "item-3",
    ]);
  });

  it("drags only the handle when it is not part of a multi-selection", () => {
    expect(resolveCanvasDragGroup(["item-1", "item-2"], "item-9")).toEqual(["item-9"]);
  });

  it("drags a single card when selection has one entry", () => {
    expect(resolveCanvasDragGroup(["item-4"], "item-4")).toEqual(["item-4"]);
  });
});

describe("mergeMarqueeSelection", () => {
  it("unions base and hit ids without duplicates", () => {
    expect(mergeMarqueeSelection(["item-1", "item-2"], ["item-2", "item-3"])).toEqual([
      "item-1",
      "item-2",
      "item-3",
    ]);
  });

  it("preserves additive marquee base ids that miss the box", () => {
    expect(mergeMarqueeSelection(["item-5"], [])).toEqual(["item-5"]);
  });
});
