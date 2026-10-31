import { stripActionPointRefsFromText } from "./actionPointSyntax.ts";
import { migrateStepActionPointRefsFromAnswerText } from "./stepActionPoints.ts";
import type { FieldName, Step } from "./types.ts";

export function ensureStepRevisions(step: Step, now = new Date().toISOString()): void {
  if (!step.problemRevisions.length) {
    step.problemRevisions = [{ rev: 1, text: step.problem, at: now }];
    step.problemRev = 1;
  }
  if (step.answer?.trim() && !step.answerRevisions.length) {
    step.answerRevisions = [{
      rev: 1,
      text: step.answer.trim(),
      at: step.decidedAt || now,
      tentative: !!step.answerTentative,
    }];
    step.answerRev = 1;
  }
}

export function normalizeStep(raw: {
  problem: string;
  answer?: string | null;
  answerTentative?: boolean;
  decidedAt?: string | null;
  actionPointRefs?: string[];
  problemRevisions?: Step["problemRevisions"];
  answerRevisions?: Step["answerRevisions"];
  problemRev?: number;
  answerRev?: number;
  archivedAt?: string | null;
  answerArchivedAt?: string | null;
}, now = new Date().toISOString()): Step {
  const answer = raw.answer?.trim() || null;
  const step: Step = {
    problem: raw.problem,
    answer,
    answerTentative: answer ? !!raw.answerTentative : false,
    decidedAt: answer ? (raw.decidedAt || now) : null,
    actionPointRefs: Array.isArray(raw.actionPointRefs)
      ? raw.actionPointRefs.filter((id) => typeof id === "string")
      : [],
    problemRevisions: raw.problemRevisions ? raw.problemRevisions.map((entry) => ({ ...entry })) : [],
    answerRevisions: raw.answerRevisions ? raw.answerRevisions.map((entry) => ({ ...entry })) : [],
    problemRev: raw.problemRev ?? 0,
    answerRev: raw.answerRev ?? 0,
    archivedAt: raw.archivedAt || null,
    answerArchivedAt: raw.answerArchivedAt || null,
  };
  ensureStepRevisions(step, now);
  migrateStepActionPointRefsFromAnswerText(step);
  return step;
}

export function stepFieldRevisions(step: Step, field: FieldName) {
  ensureStepRevisions(step);
  return field === "answer" ? step.answerRevisions : step.problemRevisions;
}

export function stepFieldHeadRev(step: Step, field: FieldName): number {
  ensureStepRevisions(step);
  return field === "answer" ? step.answerRev : step.problemRev;
}

export function getProblemText(step: Step, rev: number | null = null): string {
  ensureStepRevisions(step);
  const target = rev ?? step.problemRev;
  const entry = step.problemRevisions.find((item) => item.rev === target);
  if (entry) return entry.archived ? "" : (entry.text ?? "");
  return step.problem;
}

export function getAnswerText(
  step: Step,
  rev: number | null = null,
  options: { live?: boolean } = {},
): string | null {
  if (options.live && step.answerArchivedAt) return null;
  if (!step.answer?.trim() && !step.answerRevisions.length) return null;
  if (!step.answerRevisions.length) return step.answer?.trim() || null;
  const target = rev ?? step.answerRev;
  const entry = step.answerRevisions.find((item) => item.rev === target);
  if (entry) return entry.archived ? null : (entry.text ?? null);
  return step.answer?.trim() ?? null;
}

export function recordProblemEdit(step: Step, newText: string, at = new Date().toISOString()): void {
  const trimmed = newText.trim();
  if (!trimmed) return;
  ensureStepRevisions(step);
  if (trimmed === getProblemText(step, step.problemRev)) return;
  step.problemRev += 1;
  step.problemRevisions.push({ rev: step.problemRev, text: trimmed, at });
  step.problem = trimmed;
}

export function recordAnswerEdit(step: Step, newText: string, at = new Date().toISOString()): void {
  newText = stripActionPointRefsFromText(newText);
  const trimmed = newText.trim();
  if (!trimmed) return;
  ensureStepRevisions(step);
  const headEntry = step.answerRevisions.find((entry) => entry.rev === step.answerRev);
  if (!headEntry?.archived && trimmed === getAnswerText(step, step.answerRev)) return;
  if (!step.answerRevisions.length) {
    step.answerRevisions = [];
    step.answerRev = 0;
  }
  step.answerRev += 1;
  step.answerRevisions.push({
    rev: step.answerRev,
    text: trimmed,
    at,
    tentative: !!step.answerTentative,
  });
  step.answer = trimmed;
  step.answerArchivedAt = null;
  step.decidedAt = at;
}

export function setStepFieldHeadText(step: Step, field: FieldName, text: string): void {
  ensureStepRevisions(step);
  if (field === "answer") step.answer = text.trim() ? text : null;
  else step.problem = text;
  const rev = stepFieldHeadRev(step, field);
  const entry = stepFieldRevisions(step, field).find((item) => item.rev === rev);
  if (entry) entry.text = text;
}

export function appendFieldArchiveRevision(step: Step, field: FieldName, at = new Date().toISOString()): number {
  ensureStepRevisions(step);
  const revisions = stepFieldRevisions(step, field);
  const nextRev = stepFieldHeadRev(step, field) + 1;
  revisions.push({
    rev: nextRev,
    text: "",
    at,
    tentative: false,
    archived: true,
  });
  if (field === "answer") step.answerRev = nextRev;
  else step.problemRev = nextRev;
  return nextRev;
}

export function archiveStepAnswerField(step: Step, at = new Date().toISOString()): boolean {
  if (!step || step.answerArchivedAt) return false;
  if (!step.answer?.trim() && !step.answerRevisions.length) return false;
  appendFieldArchiveRevision(step, "answer", at);
  step.answer = null;
  step.decidedAt = null;
  step.answerTentative = false;
  step.answerArchivedAt = at;
  return true;
}
