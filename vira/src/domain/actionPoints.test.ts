import { describe, expect, it } from "vitest";
import {
  createActionPoint,
  hasOpenActionPointRefs,
  toggleActionPointDone,
} from "./actionPoints.ts";
import { formatActionPointMarkdown } from "./actionPointSyntax.ts";
import { cardStatusClass, normalizeStep } from "./steps.ts";
import { stepFullyResolved } from "./stepStatus.ts";
import type { Card } from "./types.ts";

describe("actionPoints", () => {
  it("creates ids and tracks open refs in decision text", () => {
    const bag = { nextActionPointId: 1, actionPoints: {} };
    const ap = createActionPoint(bag, "Deploy");
    const text = `Done ${formatActionPointMarkdown(ap.id, ap.title)}`;
    expect(bag.nextActionPointId).toBe(2);
    expect(hasOpenActionPointRefs(text, bag.actionPoints)).toBe(true);
    toggleActionPointDone(bag.actionPoints[ap.id]!);
    expect(hasOpenActionPointRefs(text, bag.actionPoints)).toBe(false);
  });

  it("keeps decisions flagged until referenced actionpoints are done", () => {
    const bag = { nextActionPointId: 1, actionPoints: {} };
    const ap = createActionPoint(bag, "Task");
    const step = normalizeStep({
      problem: "",
      answer: `Ship it ${formatActionPointMarkdown(ap.id, "Task")}`,
    });
    const item: Card = { id: "item-1", tags: [], archivedAt: null, steps: [step] };
    const ctx = { actionPoints: bag.actionPoints };
    expect(stepFullyResolved(step, ctx)).toBe(false);
    expect(cardStatusClass(item, ctx)).toBe("card-partial");
    toggleActionPointDone(bag.actionPoints[ap.id]!);
    expect(stepFullyResolved(step, ctx)).toBe(true);
    expect(cardStatusClass(item, ctx)).toBe("card-complete");
  });
});
