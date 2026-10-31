import { getAnswerText } from "./stepRevisions.ts";
import type { Card, CardStatusClass, Step } from "./types.ts";

export function isItemArchived(item: Card | null | undefined): boolean {
  return !!item?.archivedAt;
}

export function isStepArchived(step: Step | null | undefined): boolean {
  return !!step?.archivedAt;
}

export function itemActiveSteps(item: Card): Step[] {
  return item.steps.filter((step) => !isStepArchived(step));
}

export function liveItems(items: Record<string, Card>): Card[] {
  return Object.values(items).filter((item) => !isItemArchived(item));
}

export function stepResolved(step: Step): boolean {
  if (step.answerArchivedAt) return false;
  return !!(step.answer && step.answer.trim());
}

export function stepFullyResolved(step: Step): boolean {
  return stepResolved(step) && !step.answerTentative;
}

export function isRefLinkableStep(step: Step | null | undefined): boolean {
  return !!step && !isStepArchived(step);
}

export function liveAnswerText(step: Step): string | null {
  return getAnswerText(step, null, { live: true });
}

export function isRefLinkableAnswer(step: Step): boolean {
  return isRefLinkableStep(step) && !!liveAnswerText(step)?.trim();
}

export function toggleAnswerTentative(step: Step): void {
  if (!stepResolved(step)) return;
  step.answerTentative = !step.answerTentative;
}

export function itemNeedsDecision(item: Card): boolean {
  if (isItemArchived(item)) return false;
  return itemActiveSteps(item).some((step) => !stepFullyResolved(step));
}

export function cardStatusClass(item: Card): CardStatusClass {
  const steps = itemActiveSteps(item);
  if (!steps.length) return "card-incomplete";
  const resolved = steps.filter(stepFullyResolved).length;
  if (resolved === steps.length) return "card-complete";
  if (resolved === 0 && steps.every((step) => !stepResolved(step))) return "card-incomplete";
  return "card-partial";
}

export function formatDecisionDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${date.getFullYear()}`;
}

export function itemIdNumericSuffix(id: string): number {
  const match = String(id ?? "").match(/item-(\d+)$/i);
  return match ? parseInt(match[1] ?? "0", 10) : 0;
}

export function compareItemIds(a: { id: string } | string, b: { id: string } | string): number {
  const idA = typeof a === "string" ? a : a.id;
  const idB = typeof b === "string" ? b : b.id;
  const na = itemIdNumericSuffix(idA);
  const nb = itemIdNumericSuffix(idB);
  if (na !== nb) return na - nb;
  return idA.localeCompare(idB);
}

/** Newest (highest id) first — for decision lists. */
export function compareItemIdsNewestFirst(a: { id: string } | string, b: { id: string } | string): number {
  return compareItemIds(b, a);
}

export function cardNumber(id: string): string {
  return id.replace(/^item-/i, "");
}
