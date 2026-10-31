import { describe, expect, it } from "vitest";
import {
  addActionPointRefToStep,
  collapseDecisionShellIfNoAnswerOrRefs,
  ensureEmptyDecisionForActionPointRefs,
  hasOpenActionPointRefsForStep,
  removeActionPointRefFromStep,
  stepActionPointRefIds,
  stepHasVisibleAnswerContent,
} from "./stepActionPoints.ts";
import { cardStatusClass, stepFullyResolved, stepResolved } from "./stepStatus.ts";
import type { Card } from "./types.ts";
import { formatActionPointRef } from "./actionPointSyntax.ts";
import { normalizeStep } from "./steps.ts";

describe("stepActionPoints", () => {
  it("does not stack revisions when the empty shell is already at head", () => {
    const step = normalizeStep({ problem: "Q?", answer: null });
    ensureEmptyDecisionForActionPointRefs(step);
    addActionPointRefToStep(step, "ap-1");
    const rev = step.answerRev;
    ensureEmptyDecisionForActionPointRefs(step);
    expect(step.answerRev).toBe(rev);
    expect(step.answerRevisions).toHaveLength(1);
  });

  it("creates an empty decision shell for refs-only answers", () => {
    const step = normalizeStep({ problem: "Q?", answer: null });
    ensureEmptyDecisionForActionPointRefs(step);
    addActionPointRefToStep(step, "ap-1");
    expect(step.answer).toBe("");
    expect(step.decidedAt).toBeTruthy();
    expect(stepResolved(step)).toBe(true);
    expect(stepHasVisibleAnswerContent(step, "")).toBe(true);
  });

  it("removes a single ref without affecting others", () => {
    const step = normalizeStep({ problem: "", answer: "Ship" });
    addActionPointRefToStep(step, "ap-1");
    addActionPointRefToStep(step, "ap-2");
    expect(removeActionPointRefFromStep(step, "ap-1")).toBe(true);
    expect(step.actionPointRefs).toEqual(["ap-2"]);
    expect(removeActionPointRefFromStep(step, "ap-missing")).toBe(false);
  });

  it("dedupes action point refs on a step", () => {
    const step = normalizeStep({ problem: "", answer: "Ship" });
    addActionPointRefToStep(step, "ap-1");
    addActionPointRefToStep(step, "ap-1");
    addActionPointRefToStep(step, "ap-2");
    expect(step.actionPointRefs).toEqual(["ap-1", "ap-2"]);
  });

  it("treats missing or open action refs as blocking completion", () => {
    const step = normalizeStep({ problem: "Q", answer: "A" });
    addActionPointRefToStep(step, "ap-1");
    const open = { "ap-1": { id: "ap-1", title: "Task", done: false } };
    expect(hasOpenActionPointRefsForStep(step, open)).toBe(true);
    expect(stepFullyResolved(step, { actionPoints: open })).toBe(false);
    const item: Card = { id: "item-1", tags: [], archivedAt: null, steps: [step] };
    expect(cardStatusClass(item, { actionPoints: open })).toBe("card-partial");
    expect(hasOpenActionPointRefsForStep(step, {})).toBe(true);
    expect(stepFullyResolved(step, { actionPoints: {} })).toBe(false);
  });

  it("collapses refs-only shell when the last link is removed", () => {
    const step = normalizeStep({ problem: "Q?", answer: null });
    ensureEmptyDecisionForActionPointRefs(step);
    addActionPointRefToStep(step, "ap-2");
    removeActionPointRefFromStep(step, "ap-2");
    collapseDecisionShellIfNoAnswerOrRefs(step);
    expect(step.decidedAt).toBeNull();
    expect(stepResolved(step)).toBe(false);
  });

  it("merges legacy inline refs with actionPointRefs", () => {
    const step = normalizeStep({
      problem: "",
      answer: `Done ${formatActionPointRef("ap-9")}`,
      actionPointRefs: ["ap-1"],
    });
    expect(stepActionPointRefIds(step)).toEqual(["ap-1", "ap-9"]);
    expect(step.answer).toBe("Done");
  });
});
