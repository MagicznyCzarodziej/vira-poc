import { describe, expect, it } from "vitest";
import { movesForCanvasGroupDrag } from "./canvasGroupDrag.ts";

describe("movesForCanvasGroupDrag", () => {
  it("applies the same delta to every card in the group", () => {
    const moves = movesForCanvasGroupDrag(
      ["item-1", "item-2"],
      {
        "item-1": { x: 100, y: 200 },
        "item-2": { x: 300, y: 400 },
      },
      { x: 100, y: 200 },
      { x: 130, y: 250 },
    );
    expect(moves).toEqual([
      { id: "item-1", x: 130, y: 250 },
      { id: "item-2", x: 330, y: 450 },
    ]);
  });

  it("skips ids missing start positions", () => {
    const moves = movesForCanvasGroupDrag(
      ["item-1", "item-missing"],
      { "item-1": { x: 10, y: 10 } },
      { x: 10, y: 10 },
      { x: 20, y: 15 },
    );
    expect(moves).toEqual([{ id: "item-1", x: 20, y: 15 }]);
  });
});
