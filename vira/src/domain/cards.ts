import {
  addCardInstanceToCanvas,
  moveCardPlacementAtWorld,
  removeCanvasPlacementsForItem,
} from "./cardCanvasPlacements.ts";
import { appendFieldArchiveRevision, archiveStepAnswerField, normalizeStep } from "./steps.ts";
import { normalizeTagsList } from "./tags.ts";
import type { Card, DocBag, Step } from "./types.ts";

export type StepInput = {
  problem: string;
  answer?: string | null;
  answerTentative?: boolean;
  decidedAt?: string | null;
  problemRevisions?: Step["problemRevisions"];
  answerRevisions?: Step["answerRevisions"];
  problemRev?: number;
  answerRev?: number;
};

export function createCard(
  bag: DocBag,
  input: { problem?: string; tags?: string[]; answer?: string | null; steps?: StepInput[] },
): string | null {
  const id = `item-${bag.nextId}`;
  bag.nextId += 1;
  if (input.steps) {
    bag.items[id] = {
      id,
      tags: normalizeTagsList(input.tags ?? []),
      archivedAt: null,
      steps: input.steps.map((step) => normalizeStep(step)),
    };
    return id;
  }
  const problem = input.problem?.trim() ?? "";
  const answer = input.answer?.trim() || null;
  if (!problem && !answer) {
    bag.nextId -= 1;
    return null;
  }
  bag.items[id] = {
    id,
    tags: normalizeTagsList(input.tags ?? []),
    archivedAt: null,
    steps: [normalizeStep({ problem, answer })],
  };
  return id;
}

export function createBlankCard(bag: DocBag): string {
  const id = `item-${bag.nextId}`;
  bag.nextId += 1;
  bag.items[id] = {
    id,
    tags: [],
    archivedAt: null,
    steps: [normalizeStep({ problem: "", answer: null })],
  };
  return id;
}

export function addStep(card: Card, problem: string): boolean {
  const trimmed = problem.trim();
  if (!trimmed) return false;
  card.steps.push(normalizeStep({ problem: trimmed, answer: null }));
  return true;
}

export function archiveCard(bag: DocBag, id: string, at = new Date().toISOString()): void {
  const item = bag.items[id];
  if (!item || item.archivedAt) return;
  item.archivedAt = at;
  for (const step of item.steps) {
    if (!step.archivedAt) {
      appendFieldArchiveRevision(step, "problem", at);
      step.archivedAt = at;
    }
    if (!step.answerArchivedAt && step.answerRevisions.length) {
      appendFieldArchiveRevision(step, "answer", at);
      step.answer = null;
      step.decidedAt = null;
      step.answerTentative = false;
      step.answerArchivedAt = at;
    }
  }
  removeCanvasPlacementsForItem(bag.canvasPlacements, bag.items, id);
}

export function archiveQuestion(card: Card, stepIndex: number, at = new Date().toISOString()): boolean {
  const step = card.steps[stepIndex];
  if (!step || step.archivedAt) return false;
  const active = card.steps.filter((item) => !item.archivedAt);
  if (active.length <= 1) return false;
  appendFieldArchiveRevision(step, "problem", at);
  step.archivedAt = at;
  return true;
}

/** Place another instance of an existing card on the canvas (same item, new placement). */
export function placeAtWorld(bag: DocBag, itemId: string, x: number, y: number): string | null {
  return addCardInstanceToCanvas(bag, itemId, x, y);
}

/** Place a newly created card using its item id as the first placement key. */
export function placeNewCardAtWorld(bag: DocBag, itemId: string, x: number, y: number): string | null {
  return addCardInstanceToCanvas(bag, itemId, x, y, { useItemIdAsKey: true });
}

export function moveCardPlacement(bag: DocBag, placementKey: string, x: number, y: number): boolean {
  return moveCardPlacementAtWorld(bag, placementKey, x, y);
}

export function recomputeNextId(items: Record<string, Card>): number {
  let max = 0;
  for (const id of Object.keys(items)) {
    const match = id.match(/^item-(\d+)$/i);
    if (match) max = Math.max(max, parseInt(match[1] ?? "0", 10));
  }
  return max + 1;
}

/** Static card shape for canvas spawn-button drag preview (not persisted). */
export function canvasSpawnPreviewCard(): Card {
  return {
    id: "item-new",
    tags: [],
    archivedAt: null,
    steps: [normalizeStep({ problem: "", answer: null })],
  };
}

export { archiveStepAnswerField };
