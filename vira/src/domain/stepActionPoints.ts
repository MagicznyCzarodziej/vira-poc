import { parseActionPointIdsInText, stripActionPointRefsFromText } from "./actionPointSyntax.ts";
import { ensureStepRevisions, getAnswerText } from "./stepRevisions.ts";
import type { ActionPoint, Step } from "./types.ts";

/** Answer area shows decision UI (prose and/or linked action refs). */
export function stepHasVisibleAnswerContent(step: Step, answerText: string | null | undefined): boolean {
  if (answerText?.trim()) return true;
  return stepActionPointRefIds(step).length > 0;
}

/** Record an empty decision so action refs can attach before answer prose exists. */
export function ensureEmptyDecisionForActionPointRefs(step: Step, at = new Date().toISOString()): void {
  if (getAnswerText(step, null, { live: true })?.trim()) return;
  ensureStepRevisions(step);
  step.answer = "";
  step.answerTentative = false;
  step.decidedAt = step.decidedAt ?? at;
  step.answerArchivedAt = null;
  const head = step.answerRevisions.find((entry) => entry.rev === step.answerRev && !entry.archived);
  if (head?.text.trim()) return;
  if (head && !head.text.trim()) return;
  if (!step.answerRevisions.length) {
    step.answerRev = 1;
    step.answerRevisions = [{ rev: 1, text: "", at: step.decidedAt, tentative: false }];
    return;
  }
  step.answerRev += 1;
  step.answerRevisions.push({
    rev: step.answerRev,
    text: "",
    at,
    tentative: false,
  });
}

export function stepActionPointRefIds(step: Step): string[] {
  const refs = step.actionPointRefs ?? [];
  const seen = new Set(refs);
  const out = [...refs];
  const text = getAnswerText(step, null, { live: true }) ?? "";
  for (const id of parseActionPointIdsInText(text)) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function addActionPointRefToStep(step: Step, actionPointId: string): void {
  if (!step.actionPointRefs) step.actionPointRefs = [];
  if (!step.actionPointRefs.includes(actionPointId)) {
    step.actionPointRefs.push(actionPointId);
  }
}

export function removeActionPointRefFromStep(step: Step, actionPointId: string): boolean {
  const refs = step.actionPointRefs;
  if (!refs?.length) return false;
  const next = refs.filter((id) => id !== actionPointId);
  if (next.length === refs.length) return false;
  step.actionPointRefs = next;
  return true;
}

export function hasOpenActionPointRefsForStep(
  step: Step,
  actionPoints: Record<string, ActionPoint>,
): boolean {
  for (const id of stepActionPointRefIds(step)) {
    const ap = actionPoints[id];
    if (!ap || !ap.done) return true;
  }
  return false;
}

/** Revert refs-only empty decision back to “Add decision” when no links remain. */
export function collapseDecisionShellIfNoAnswerOrRefs(step: Step): void {
  const prose = getAnswerText(step, null, { live: true })?.trim() ?? "";
  if (prose) return;
  if (stepActionPointRefIds(step).length > 0) return;
  step.answer = null;
  step.decidedAt = null;
  step.answerTentative = false;
}

/** Move legacy inline `!apN` tokens onto the step and strip them from answer text. */
export function migrateStepActionPointRefsFromAnswerText(step: Step): void {
  const answer = getAnswerText(step, null, { live: true }) ?? "";
  const fromText = parseActionPointIdsInText(answer);
  if (fromText.length === 0 && !(step.actionPointRefs?.length)) return;

  const refs = [...(step.actionPointRefs ?? [])];
  for (const id of fromText) {
    if (!refs.includes(id)) refs.push(id);
  }
  step.actionPointRefs = refs;

  const stripped = stripActionPointRefsFromText(answer);
  if (stripped === answer) return;

  step.answer = stripped || null;
  if (step.answerRevisions.length && step.answerRev) {
    const head = step.answerRevisions.find((entry) => entry.rev === step.answerRev);
    if (head) head.text = stripped;
  }
}
