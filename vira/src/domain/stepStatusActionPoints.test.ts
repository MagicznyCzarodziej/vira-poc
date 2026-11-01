import { describe, expect, it } from "vitest";
import { addActionPointRefToStep, ensureEmptyDecisionForActionPointRefs } from "./stepActionPoints.ts";
import { archiveStepAnswerField } from "./stepRevisions.ts";
import { cardStatusClass, stepFlaggedByActionPoints, stepFullyResolved } from "./stepStatus.ts";
import type { Card } from "./types.ts";
import { normalizeStep } from "./steps.ts";

describe("step status with open action points", () => {
  const open = { "ap-1": { id: "ap-1", title: "Deploy", done: false } };

  it("flags open actions even when the answer field was archived", () => {
    const step = normalizeStep({ problem: "", answer: "Ship it" });
    addActionPointRefToStep(step, "ap-1");
    expect(archiveStepAnswerField(step)).toBe(true);
    expect(stepFlaggedByActionPoints(step, { actionPoints: open })).toBe(true);
    expect(stepFullyResolved(step, { actionPoints: open })).toBe(false);
  });

  it("never marks the card complete while an open action ref remains", () => {
    const step = normalizeStep({ problem: "", answer: "Ship it" });
    addActionPointRefToStep(step, "ap-1");
    const item: Card = { id: "item-1", tags: [], archivedAt: null, steps: [step] };
    expect(cardStatusClass(item, { actionPoints: open })).toBe("card-partial");

    archiveStepAnswerField(step);
    ensureEmptyDecisionForActionPointRefs(step);
    expect(cardStatusClass(item, { actionPoints: open })).toBe("card-partial");
    expect(cardStatusClass(item, { actionPoints: open })).not.toBe("card-complete");
  });
});
