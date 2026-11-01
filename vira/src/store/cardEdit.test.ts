// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { addStep } from "../domain/index.ts";
import { issueRefAutocompleteLabel } from "../domain/refResolve.ts";
import { cardStatusClass, normalizeStep } from "../domain/steps.ts";
import { stepFullyResolved, stepResolved } from "../domain/stepStatus.ts";
import { parseIssueRef } from "../domain/refs.ts";
import { isCanvasPlacementEditing } from "./editTarget.ts";
import { useDocument } from "./useDocument.ts";

describe("createBlankCard intent", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("starts canvas decision cards in the answer field", () => {
    const id = useDocument.getState().createBlankCard("canvas", "decision");
    expect(id).toBeTruthy();
    expect(useDocument.getState().editing).toEqual({
      id,
      field: "answer",
      step: 0,
      surface: "canvas",
      canvasPlacementKey: id,
    });
  });

  it("starts canvas question cards in the problem field", () => {
    const id = useDocument.getState().createBlankCard("canvas", "question");
    expect(id).toBeTruthy();
    expect(useDocument.getState().editing).toEqual({
      id,
      field: "problem",
      step: 0,
      surface: "canvas",
      canvasPlacementKey: id,
    });
  });
});

describe("composer submit", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("creates a decision-only card from the decision composer", () => {
    useDocument.getState().openNewDecision();
    useDocument.getState().submitComposer("Ship REST first");
    const items = useDocument.getState().items;
    const id = Object.keys(items).find((key) => items[key]?.steps[0]?.answer === "Ship REST first");
    expect(id).toBeDefined();
    const card = items[id!]!;
    expect(card.steps[0]!.problem.trim()).toBe("");
    expect(useDocument.getState().openComposer).toBe(false);
    expect(useDocument.getState().editing).toBeNull();
  });

  it("creates a question-first card and opens the answer field", () => {
    useDocument.getState().openNewQuestion();
    expect(useDocument.getState().composerIntent).toBe("question");
    useDocument.getState().submitComposer("Should we ship?");
    const items = useDocument.getState().items;
    const entry = Object.entries(items).find(([, card]) => card.steps[0]?.problem === "Should we ship?");
    expect(entry).toBeDefined();
    const [id] = entry!;
    expect(items[id]!.steps[0]!.answer).toBeNull();
    expect(useDocument.getState().editing).toMatchObject({
      id,
      field: "answer",
      step: 0,
    });
  });
});

describe("decision-only follow-ups", () => {
  it("adds follow-up steps with question text on a decision-only card", () => {
    const card = {
      id: "item-1",
      tags: [],
      archivedAt: null,
      steps: [normalizeStep({ problem: "", answer: "Ship REST" })],
    };
    expect(addStep(card, "What about GraphQL?")).toBe(true);
    expect(card.steps).toHaveLength(2);
    expect(card.steps[1]!.problem).toBe("What about GraphQL?");
    expect(card.steps[1]!.answer).toBeNull();
  });
});

describe("standalone action points", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("creates an action in the list", () => {
    const id = useDocument.getState().createStandaloneActionPoint("Deploy");
    expect(id).toMatch(/^ap-/);
    expect(useDocument.getState().actionPoints[id]?.title).toBe("Deploy");
    expect(useDocument.getState().editing?.field).toBe("actionPoint");
  });

  it("marks done and removes action from canvas", () => {
    const id = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().cancelEdit();
    useDocument.getState().placeActionPointAtWorld(id, 10, 20);
    expect(useDocument.getState().actionPoints[id]?.done).toBe(false);
    useDocument.getState().toggleActionPointDone(id);
    useDocument.getState().removeActionPointFromCanvas(id);
    const next = useDocument.getState();
    expect(next.actionPoints[id]?.done).toBe(true);
    expect(next.actionPointPlacements[id]).toBeUndefined();
  });

  it("commits action title edits", () => {
    const id = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().commitEdit("Ship to prod");
    expect(useDocument.getState().actionPoints[id]?.title).toBe("Ship to prod");
    expect(useDocument.getState().editing).toBeNull();
  });

  it("places an action on the canvas", () => {
    const id = useDocument.getState().createStandaloneActionPoint("Task");
    useDocument.getState().placeActionPointAtWorld(id, 50, 60);
    expect(useDocument.getState().actionPointPlacements[id]).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
  });
});

describe("action points on decisions", () => {
  beforeEach(() => {
    useDocument.getState().clearAll();
  });

  it("adds a linked actionpoint and opens the new action for editing", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const id = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().addActionPointToDecision(id, 0, "list");
    const state = useDocument.getState();
    expect(Object.keys(state.actionPoints)).toHaveLength(1);
    const ap = Object.values(state.actionPoints)[0]!;
    expect(state.items[id]!.steps[0]!.actionPointRefs).toEqual([ap.id]);
    expect(state.items[id]!.steps[0]!.answer ?? "").not.toMatch(/!ap\d+/);
    expect(state.editing?.field).toBe("actionPoint");
    expect(state.editing?.id).toBe(ap.id);
    expect(state.editing?.surface).toBe("list");
  });

  it("opens the new action for editing even while the decision answer is being edited", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const id = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().beginEdit({ id, field: "answer", step: 0, surface: "canvas" });
    const apId = useDocument.getState().addActionPointToDecision(id, 0, "canvas");
    expect(apId).toBeTruthy();
    expect(useDocument.getState().editing).toEqual({
      id: apId,
      field: "actionPoint",
      step: 0,
      surface: "list",
    });
  });

  it("links an existing actionpoint when dropped on a decision answer", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().cancelEdit();
    const ok = useDocument.getState().linkActionPointToDecision(apId, itemId, 0);
    expect(ok).toBe(true);
    expect(useDocument.getState().items[itemId]!.steps[0]!.actionPointRefs).toEqual([apId]);
  });

  it("does not duplicate refs when linking the same action twice", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().cancelEdit();
    expect(useDocument.getState().linkActionPointToDecision(apId, itemId, 0)).toBe(true);
    expect(useDocument.getState().linkActionPointToDecision(apId, itemId, 0)).toBe(true);
    expect(useDocument.getState().items[itemId]!.steps[0]!.actionPointRefs).toEqual([apId]);
  });

  it("links onto an unanswered question by creating an empty decision with the ref", () => {
    useDocument.getState().submitComposer("Need answer", "question");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Later");
    useDocument.getState().cancelEdit();
    expect(useDocument.getState().linkActionPointToDecision(apId, itemId, 0)).toBe(true);
    const step = useDocument.getState().items[itemId]!.steps[0]!;
    expect(step.actionPointRefs).toEqual([apId]);
    expect(step.answer ?? "").toBe("");
    expect(step.decidedAt).toBeTruthy();
  });

  it("stays partial after empty answer commit when a linked action is still open", () => {
    useDocument.getState().submitComposer("Need answer", "question");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Later");
    useDocument.getState().linkActionPointToDecision(apId, itemId, 0);
    useDocument.getState().beginEdit({ id: itemId, field: "answer", step: 0, surface: "list" });
    useDocument.getState().commitEdit("");
    const step = useDocument.getState().items[itemId]!.steps[0]!;
    const ctx = { actionPoints: useDocument.getState().actionPoints };
    const item = useDocument.getState().items[itemId]!;
    expect(step.actionPointRefs).toEqual([apId]);
    expect(step.answerArchivedAt).toBeNull();
    expect(step.decidedAt).toBeTruthy();
    expect(stepResolved(step)).toBe(true);
    expect(stepFullyResolved(step, ctx)).toBe(false);
    expect(cardStatusClass(item, ctx)).toBe("card-partial");
  });

  it("does not remount when beginEdit is called twice for the same target", () => {
    useDocument.getState().submitComposer("Q?", "question");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const target = { id: itemId, field: "problem" as const, step: 0, surface: "canvas" as const };
    useDocument.getState().beginEdit(target);
    const nonce = useDocument.getState().focusNonce;
    useDocument.getState().beginEdit(target);
    expect(useDocument.getState().focusNonce).toBe(nonce);
  });

  it("commits problem edits on the canvas surface", () => {
    useDocument.getState().submitComposer("Old question?", "question");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 10, 10);
    useDocument.getState().beginEdit({
      id: itemId,
      field: "problem",
      step: 0,
      surface: "canvas",
      canvasPlacementKey: itemId,
    });
    useDocument.getState().commitEdit("New question?");
    expect(useDocument.getState().items[itemId]!.steps[0]!.problem).toBe("New question?");
    expect(useDocument.getState().editing).toBeNull();
  });

  it("scopes canvas editing to one placement when the same card appears twice", () => {
    useDocument.getState().submitComposer("Shared card", "question");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    useDocument.getState().cancelEdit();
    useDocument.getState().placeNewCardAtWorld(itemId, 10, 10);
    useDocument.getState().placeAtWorld(itemId, 200, 200);
    const placements = Object.keys(useDocument.getState().canvasPlacements).filter(
      (key) => useDocument.getState().canvasPlacements[key]?.itemId === itemId
        || key === itemId,
    );
    expect(placements).toHaveLength(2);
    const [firstKey, secondKey] = placements.sort((a, b) => a.localeCompare(b));

    useDocument.getState().beginEdit({
      id: itemId,
      field: "problem",
      step: 0,
      surface: "canvas",
      canvasPlacementKey: secondKey,
    });
    const editing = useDocument.getState().editing;
    expect(editing?.canvasPlacementKey).toBe(secondKey);
    expect(isCanvasPlacementEditing(editing, itemId, secondKey, "problem", 0)).toBe(true);
    expect(isCanvasPlacementEditing(editing, itemId, firstKey, "problem", 0)).toBe(false);

    const nonce = useDocument.getState().focusNonce;
    useDocument.getState().beginEdit({
      id: itemId,
      field: "problem",
      step: 0,
      surface: "canvas",
      canvasPlacementKey: secondKey,
    });
    expect(useDocument.getState().focusNonce).toBe(nonce);

    useDocument.getState().commitEdit("Updated once");
    expect(useDocument.getState().items[itemId]!.steps[0]!.problem).toBe("Updated once");

    useDocument.getState().beginEdit({
      id: itemId,
      field: "problem",
      step: 0,
      surface: "canvas",
      canvasPlacementKey: firstKey,
    });
    expect(useDocument.getState().focusNonce).toBeGreaterThan(nonce);
    expect(useDocument.getState().editing?.canvasPlacementKey).toBe(firstKey);
  });

  it("allows typing decision prose after empty commit on a refs-only step", () => {
    useDocument.getState().submitComposer("Need answer", "question");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Later");
    useDocument.getState().linkActionPointToDecision(apId, itemId, 0);
    useDocument.getState().beginEdit({ id: itemId, field: "answer", step: 0, surface: "list" });
    useDocument.getState().commitEdit("");
    useDocument.getState().beginEdit({ id: itemId, field: "answer", step: 0, surface: "list" });
    useDocument.getState().commitEdit("We ship Friday");
    const step = useDocument.getState().items[itemId]!.steps[0]!;
    expect(step.answer).toBe("We ship Friday");
    expect(step.actionPointRefs).toEqual([apId]);
  });

  it("stays partial while a linked action is still open", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().cancelEdit();
    useDocument.getState().linkActionPointToDecision(apId, itemId, 0);
    const item = useDocument.getState().items[itemId]!;
    const ctx = { actionPoints: useDocument.getState().actionPoints };
    expect(cardStatusClass(item, ctx)).toBe("card-partial");
  });

  it("stays partial after archiving the answer when a linked action is still open", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().cancelEdit();
    useDocument.getState().linkActionPointToDecision(apId, itemId, 0);
    useDocument.getState().archiveAnswer(itemId, 0);
    const item = useDocument.getState().items[itemId]!;
    const step = item.steps[0]!;
    const ctx = { actionPoints: useDocument.getState().actionPoints };
    expect(step.actionPointRefs).toEqual([apId]);
    expect(stepFullyResolved(step, ctx)).toBe(false);
    expect(cardStatusClass(item, ctx)).toBe("card-partial");
    expect(cardStatusClass(item, ctx)).not.toBe("card-complete");
  });

  it("unlinks an action ref from a decision step", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().cancelEdit();
    useDocument.getState().linkActionPointToDecision(apId, itemId, 0);
    expect(useDocument.getState().unlinkActionPointFromDecision(apId, itemId, 0)).toBe(true);
    expect(useDocument.getState().items[itemId]!.steps[0]!.actionPointRefs ?? []).toEqual([]);
    expect(useDocument.getState().actionPoints[apId]?.title).toBe("Deploy");
  });

  it("rejects linking unknown actions or decisions", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const itemId = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().createStandaloneActionPoint("Deploy");
    useDocument.getState().cancelEdit();
    expect(useDocument.getState().linkActionPointToDecision("ap-missing", itemId, 0)).toBe(false);
    expect(useDocument.getState().linkActionPointToDecision(apId, "item-missing", 0)).toBe(false);
    expect(useDocument.getState().linkActionPointToDecision(apId, itemId, 99)).toBe(false);
  });

  it("toggle marks an actionpoint done", () => {
    useDocument.getState().submitComposer("Ship REST", "decision");
    const id = Object.keys(useDocument.getState().items)[0]!;
    const apId = useDocument.getState().addActionPointToDecision(id, 0, "list");
    useDocument.getState().toggleActionPointDone(apId!);
    expect(useDocument.getState().actionPoints[apId!]?.done).toBe(true);
  });
});

describe("issueRefAutocompleteLabel", () => {
  it("falls back to decision text when the card has no question", () => {
    const items = {
      "item-9": {
        id: "item-9",
        tags: [],
        archivedAt: null,
        steps: [normalizeStep({ problem: "", answer: "Use Postgres" })],
      },
    };
    const parsed = parseIssueRef("!9");
    expect(parsed).toBeTruthy();
    expect(issueRefAutocompleteLabel(items, parsed!)).toBe("Use Postgres");
  });
});
