import { createCard, placeNewCardAtWorld, type StepInput } from "./cards.ts";
import { CARD_WIDTH, WORLD_H, WORLD_W } from "./constants.ts";
import {
  NOTE_DEFAULT_HEIGHT,
  NOTE_DEFAULT_WIDTH,
  placeNoteAtWorld,
  type NoteCanvasBag,
} from "./noteCanvas.ts";
import { createNote } from "./notes.ts";
import type { DocBag } from "./types.ts";

/** Deterministic follow-up count: ~76% none, ~18% one, ~6% two. */
export function seedFollowupCountForCard(index: number): number {
  const bucket = (index * 7919 + 13) % 100;
  if (bucket < 76) return 0;
  if (bucket < 94) return 1;
  return 2;
}

function buildQuestionDecisionSteps(cardIndex: number): StepInput[] {
  const n = cardIndex + 1;
  const decidedAt = new Date(2020, 0, 1 + (cardIndex % 360)).toISOString();
  const steps: StepInput[] = [
    {
      problem: `Question ${n}: what should we do about topic ${n}?`,
      answer: `Decision ${n}: proceed with option A.`,
      decidedAt,
    },
  ];
  const followups = seedFollowupCountForCard(cardIndex);
  for (let f = 0; f < followups; f += 1) {
    steps.push({
      problem: `Follow-up ${f + 1} for question ${n}?`,
      answer: f === 0 ? `Follow-up decision ${f + 1} for Q${n}.` : null,
    });
  }
  return steps;
}

/**
 * Dev/benchmark helper: cards with question + decision on step 0 and 0–2 follow-up steps (mostly none).
 * Returns item ids; optionally places each new card on the canvas grid.
 */
export function seedQuestionDecisionCards(
  bag: DocBag,
  count: number,
  options: { placeOnCanvas?: boolean } = {},
): string[] {
  const placeOnCanvas = options.placeOnCanvas ?? true;
  const cols = Math.ceil(Math.sqrt(count));
  const gapX = CARD_WIDTH + 24;
  const gapY = 140;
  const startX = Math.max(8, Math.round(WORLD_W / 2 - (cols * gapX) / 2));
  const startY = Math.max(8, Math.round(WORLD_H / 2 - (Math.ceil(count / cols) * gapY) / 2));
  const itemIds: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = createCard(bag, { steps: buildQuestionDecisionSteps(i) });
    if (!id) continue;
    itemIds.push(id);
    if (placeOnCanvas) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      placeNewCardAtWorld(bag, id, startX + col * gapX, startY + row * gapY);
    }
  }
  return itemIds;
}

/** Dev/benchmark helper: place `count` decision cards on a grid (does not create notes/frames). */
export function seedCanvasCardPlacements(bag: DocBag, count: number): string[] {
  const cols = Math.ceil(Math.sqrt(count));
  const gapX = CARD_WIDTH + 24;
  const gapY = 140;
  const startX = Math.max(8, Math.round(WORLD_W / 2 - (cols * gapX) / 2));
  const startY = Math.max(8, Math.round(WORLD_H / 2 - (Math.ceil(count / cols) * gapY) / 2));
  const keys: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const id = createCard(bag, {
      problem: "",
      answer: `Perf seed decision ${i + 1}`,
    });
    if (!id) continue;
    const key = placeNewCardAtWorld(bag, id, startX + col * gapX, startY + row * gapY);
    if (key) keys.push(key);
  }
  return keys;
}

/** Dev/benchmark helper: place `count` sticky notes on a grid with short body text. */
export function seedCanvasNotes(bag: NoteCanvasBag, count: number): string[] {
  const cols = Math.ceil(Math.sqrt(count));
  const gapX = NOTE_DEFAULT_WIDTH + 16;
  const gapY = NOTE_DEFAULT_HEIGHT + 16;
  const rows = Math.ceil(count / cols);
  const gridW = cols * gapX;
  const gridH = rows * gapY;
  const startX = Math.max(8, Math.round(WORLD_W / 2 - gridW / 2));
  const startY = Math.max(8, Math.round(WORLD_H / 2 - gridH / 2));
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const note = createNote(bag, `Note ${i + 1}`);
    placeNoteAtWorld(bag.notePlacements, bag.notes, note.id, startX + col * gapX, startY + row * gapY);
    ids.push(note.id);
  }
  return ids;
}
