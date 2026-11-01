import { describe, expect, it } from "vitest";
import { CARD_WIDTH } from "./constants.ts";
import { planTagFrameOnCanvas, unionFrameRects } from "./tagFrameLayout.ts";
import type { Card } from "./types.ts";

const item = (id: string, tags: string[]): Card => ({
  id,
  tags,
  archivedAt: null,
  steps: [{ problem: "?", answer: null, answerTentative: false, decidedAt: null, problemRevisions: [], answerRevisions: [], problemRev: 0, answerRev: 0, archivedAt: null, answerArchivedAt: null }],
});

describe("tagFrameLayout", () => {
  it("unions card footprints", () => {
    expect(unionFrameRects([
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 80, y: 40, width: 100, height: 50 },
    ])).toEqual({ x: 0, y: 0, width: 180, height: 90 });
  });

  it("plans grid placements for items not on canvas", () => {
    const items = { "item-1": item("item-1", ["sprint"]), "item-2": item("item-2", ["sprint"]) };
    const plan = planTagFrameOnCanvas(items, { x: 400, y: 300 }, "sprint");
    expect(plan?.placementAdds).toHaveLength(2);
    expect(plan?.frameBounds.width).toBeGreaterThan(CARD_WIDTH);
    expect(plan?.frameTitle).toBe("sprint");
  });

  it("plans new grid placements even when cards already exist on canvas", () => {
    const items = { "item-1": item("item-1", ["sprint"]) };
    const plan = planTagFrameOnCanvas(items, { x: 400, y: 300 }, "sprint");
    expect(plan?.placementAdds).toHaveLength(1);
    expect(plan?.placementAdds[0]?.itemId).toBe("item-1");
    expect(plan?.placementAdds[0]?.x).not.toBe(200);
    expect(plan?.placementAdds[0]?.y).not.toBe(100);
  });
});
