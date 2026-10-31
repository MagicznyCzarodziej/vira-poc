import { describe, expect, it } from "vitest";
import { createCard } from "./cards.ts";
import { cardStatusClass, compareItemIds } from "./steps.ts";
import { archiveStepAnswerField, normalizeStep } from "./steps.ts";
import { parseTags } from "./tags.ts";
import { isIssueRefStale, parseIssueRef } from "./refs.ts";
import { buildSeedBag } from "./seed.ts";
import { normalizeStep as norm } from "./steps.ts";
import type { Card } from "./types.ts";

describe("tags", () => {
  it("lowercases and dedupes", () => {
    expect(parseTags(" API, api, Privacy ")).toEqual(["api", "privacy"]);
  });
});

describe("createCard", () => {
  it("creates a decision-only card with no question", () => {
    const bag = { nextId: 1, items: {}, canvasPlacements: {}, canvasViewport: null };
    const id = createCard(bag, { problem: "", answer: "Ship REST first" });
    expect(id).toBe("item-1");
    const card = bag.items["item-1"];
    expect(card?.steps[0]?.problem.trim()).toBe("");
    expect(card?.steps[0]?.answer).toBe("Ship REST first");
  });

  it("rejects a card with neither question nor decision", () => {
    const bag = { nextId: 1, items: {}, canvasPlacements: {}, canvasViewport: null };
    expect(createCard(bag, { problem: "", answer: "" })).toBeNull();
    expect(bag.nextId).toBe(1);
  });

  it("still creates question-first cards with an open decision", () => {
    const bag = { nextId: 1, items: {}, canvasPlacements: {}, canvasViewport: null };
    const id = createCard(bag, { problem: "Should we ship?" });
    expect(id).toBe("item-1");
    expect(bag.items["item-1"]?.steps[0]?.problem).toBe("Should we ship?");
    expect(bag.items["item-1"]?.steps[0]?.answer).toBeNull();
  });
});

describe("card status", () => {
  function card(steps: Card["steps"]): Card {
    return { id: "item-1", tags: [], archivedAt: null, steps };
  }

  it("is incomplete when nothing is decided", () => {
    const step = normalizeStep({ problem: "Q", answer: null });
    expect(cardStatusClass(card([step]))).toBe("card-incomplete");
  });

  it("is partial when a decision is tentative", () => {
    const step = normalizeStep({ problem: "Q", answer: "A", answerTentative: true });
    expect(cardStatusClass(card([step]))).toBe("card-partial");
  });

  it("is complete when every active step is settled", () => {
    const step = normalizeStep({ problem: "Q", answer: "A" });
    expect(cardStatusClass(card([step]))).toBe("card-complete");
  });

  it("treats decision-only steps as complete when settled", () => {
    const step = normalizeStep({ problem: "", answer: "Decided" });
    expect(cardStatusClass(card([step]))).toBe("card-complete");
  });
});

describe("archive decision", () => {
  it("appends a removed head revision", () => {
    const step = normalizeStep({ problem: "Q", answer: "A" });
    expect(archiveStepAnswerField(step, "2026-01-01T00:00:00.000Z")).toBe(true);
    expect(step.answer).toBeNull();
    expect(step.answerArchivedAt).toBeTruthy();
    const head = step.answerRevisions.find((entry) => entry.rev === step.answerRev);
    expect(head?.archived).toBe(true);
    expect(head?.text).toBe("");
  });
});

describe("refs", () => {
  it("parses card, question, decision, and pin", () => {
    expect(parseIssueRef("!12")).toMatchObject({ itemId: "item-12", stepIndex: null, focusAnswer: false, revision: null });
    expect(parseIssueRef("!12/2")).toMatchObject({ stepIndex: 1, focusAnswer: false });
    expect(parseIssueRef("!12/a2")).toMatchObject({ stepIndex: 1, focusAnswer: true });
    expect(parseIssueRef("!12/a2@v3")?.revision).toBe(3);
  });

  it("marks an old pin stale", () => {
    const step = norm({ problem: "Q", answer: "first" });
    step.answerRevisions.push({ rev: 2, text: "second", at: "2026-02-01T00:00:00.000Z" });
    step.answerRev = 2;
    step.answer = "second";
    const item: Card = { id: "item-3", tags: [], archivedAt: null, steps: [step] };
    const parsed = parseIssueRef("!3/a1@v1");
    expect(parsed && isIssueRefStale({ "item-3": item }, parsed)).toBe(true);
  });
});

describe("sort", () => {
  it("orders item-2 before item-10", () => {
    expect(compareItemIds("item-2", "item-10")).toBeLessThan(0);
  });
});

describe("seed", () => {
  it("includes the pinned smart-beta fixture", () => {
    const bag = buildSeedBag();
    const fixture = Object.values(bag.items).find((item) => item.tags.includes("fixtures"));
    expect(fixture?.steps[0]?.answer).toContain("@v2");
    expect(Object.keys(bag.items).length).toBeGreaterThan(5);
  });
});
