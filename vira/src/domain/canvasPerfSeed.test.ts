import { describe, expect, it } from "vitest";
import {
  seedCanvasCardPlacements,
  seedCanvasNotes,
  seedFollowupCountForCard,
  seedQuestionDecisionCards,
} from "./canvasPerfSeed.ts";
import type { DocBag } from "./types.ts";
import type { NoteCanvasBag } from "./noteCanvas.ts";

function emptyBag(): DocBag {
  return {
    nextId: 1,
    nextCanvasPlacementId: 1,
    items: {},
    canvasPlacements: {},
    canvasViewport: null,
  };
}

describe("canvasPerfSeed", () => {
  it("places the requested number of cards on canvas", () => {
    const bag = emptyBag();
    const keys = seedCanvasCardPlacements(bag, 50);
    expect(keys).toHaveLength(50);
    expect(Object.keys(bag.canvasPlacements)).toHaveLength(50);
  });

  it("seed 200 completes in reasonable time", () => {
    const bag = emptyBag();
    const t0 = performance.now();
    seedCanvasCardPlacements(bag, 200);
    const ms = performance.now() - t0;
    expect(Object.keys(bag.canvasPlacements)).toHaveLength(200);
    expect(ms).toBeLessThan(2000);
  });
});

function emptyNoteBag(): NoteCanvasBag {
  return { nextNoteId: 1, notes: {}, notePlacements: {} };
}

describe("seedQuestionDecisionCards", () => {
  it("creates question + decision with expected follow-up mix", () => {
    const bag = emptyBag();
    const ids = seedQuestionDecisionCards(bag, 100, { placeOnCanvas: false });
    expect(ids).toHaveLength(100);
    let withFollowups = 0;
    ids.forEach((id, index) => {
      const card = bag.items[id]!;
      expect(card.steps[0]?.problem).toMatch(/^Question \d+:/);
      expect(card.steps[0]?.answer).toMatch(/^Decision \d+:/);
      if (card.steps.length > 1) withFollowups += 1;
      expect(card.steps.length - 1).toBe(seedFollowupCountForCard(index));
    });
    expect(withFollowups).toBeLessThan(40);
  });

  it("seed 300 with canvas placement completes in reasonable time", () => {
    const bag = emptyBag();
    const t0 = performance.now();
    seedQuestionDecisionCards(bag, 300);
    const ms = performance.now() - t0;
    expect(Object.keys(bag.items)).toHaveLength(300);
    expect(Object.keys(bag.canvasPlacements)).toHaveLength(300);
    expect(ms).toBeLessThan(4000);
  });
});

describe("seedCanvasNotes", () => {
  it("places the requested number of notes", () => {
    const bag = emptyNoteBag();
    const ids = seedCanvasNotes(bag, 50);
    expect(ids).toHaveLength(50);
    expect(Object.keys(bag.notePlacements)).toHaveLength(50);
    expect(bag.notes[ids[0]!]?.body).toBe("Note 1");
  });

  it("seed 500 completes in reasonable time", () => {
    const bag = emptyNoteBag();
    const t0 = performance.now();
    seedCanvasNotes(bag, 500);
    const ms = performance.now() - t0;
    expect(Object.keys(bag.notePlacements)).toHaveLength(500);
    expect(ms).toBeLessThan(3000);
  });
});
