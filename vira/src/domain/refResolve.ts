import { formatIssueRefDisplay, formatIssueRefInText, parseIssueRef, truncateLabel } from "./refSyntax.ts";
import { getAnswerText, getProblemText, stepFieldHeadRev, stepFieldRevisions } from "./stepRevisions.ts";
import { isItemArchived, isStepArchived } from "./stepStatus.ts";
import type { Card, FieldName, IssueRef, StaleReason, Step } from "./types.ts";

export function issueRefRevisionExists(step: Step, parsed: IssueRef): boolean {
  if (parsed.revision == null) return true;
  const field: FieldName = parsed.focusAnswer ? "answer" : "problem";
  return stepFieldRevisions(step, field).some((entry) => entry.rev === parsed.revision);
}

export function issueRefExists(items: Record<string, Card>, parsed: IssueRef): boolean {
  const item = items[parsed.itemId];
  if (!item) return false;
  if (parsed.stepIndex == null) return true;
  const step = item.steps[parsed.stepIndex];
  if (!step) return false;
  return issueRefRevisionExists(step, parsed);
}

export function issueRefStaleReason(items: Record<string, Card>, parsed: IssueRef): StaleReason | null {
  const item = items[parsed.itemId];
  if (!item) return "missing";
  if (isItemArchived(item)) return "card-archived";
  if (parsed.stepIndex == null) return null;
  const step = item.steps[parsed.stepIndex];
  if (!step) return "missing";
  if (isStepArchived(step)) return "step-archived";
  if (parsed.focusAnswer && step.answerArchivedAt) return "answer-archived";
  const field: FieldName = parsed.focusAnswer ? "answer" : "problem";
  const headRev = stepFieldHeadRev(step, field);
  if (parsed.revision != null && parsed.revision !== headRev) return "revision";
  const head = stepFieldRevisions(step, field).find((entry) => entry.rev === headRev);
  if (parsed.revision == null && head?.archived) {
    return parsed.focusAnswer ? "answer-archived" : "step-archived";
  }
  return null;
}

export function isIssueRefStale(items: Record<string, Card>, parsed: IssueRef): boolean {
  return issueRefStaleReason(items, parsed) != null;
}

export function pinCurrentIssueRefRevision(items: Record<string, Card>, parsed: IssueRef): IssueRef {
  const item = items[parsed.itemId];
  if (!item?.steps.length) return parsed;
  let step: Step | undefined;
  let field: FieldName = "problem";
  if (parsed.focusAnswer && parsed.stepIndex != null) {
    step = item.steps[parsed.stepIndex];
    field = "answer";
  } else if (parsed.stepIndex != null) {
    step = item.steps[parsed.stepIndex];
    field = "problem";
  } else {
    step = item.steps[0];
    field = item.steps.length === 1 && step && getAnswerText(step) ? "answer" : "problem";
  }
  if (!step) return parsed;
  const head = stepFieldHeadRev(step, field);
  if (field === "answer" && head < 1) return parsed;
  return { ...parsed, revision: head };
}

export function issueRefAutocompleteLabel(items: Record<string, Card>, parsed: IssueRef): string {
  const item = items[parsed.itemId];
  if (!item) return formatIssueRefDisplay(parsed);
  if (parsed.focusAnswer && parsed.stepIndex != null) {
    const step = item.steps[parsed.stepIndex];
    return truncateLabel(step ? (getAnswerText(step) || "Answer") : "Answer", 48);
  }
  if (parsed.stepIndex != null) {
    const step = item.steps[parsed.stepIndex];
    const label = step ? (getProblemText(step).trim() || getAnswerText(step) || item.id) : item.id;
    return truncateLabel(label, 48);
  }
  const step = item.steps[0];
  const label = step ? (getProblemText(step).trim() || getAnswerText(step) || item.id) : item.id;
  return truncateLabel(label, 48);
}

export function buildIssueRefMarkdown(items: Record<string, Card>, refToken: string, label: string): string | null {
  const parsed = parseIssueRef(refToken);
  if (!parsed) return null;
  const pinned = pinCurrentIssueRefRevision(items, parsed);
  const inText = formatIssueRefInText(pinned);
  const trimmed = label.trim();
  if (!trimmed) return inText;
  const linkLabel = trimmed.replace(/[[\]]/g, "");
  return `[${linkLabel}](${inText})`;
}

export function refTargetStep(items: Record<string, Card>, parsed: IssueRef): { item: Card; step: Step; field: FieldName } | null {
  if (parsed.stepIndex == null) return null;
  const item = items[parsed.itemId];
  const step = item?.steps[parsed.stepIndex];
  if (!item || !step) return null;
  return { item, step, field: parsed.focusAnswer ? "answer" : "problem" };
}

export function revisionFieldText(step: Step, field: FieldName, rev: number | null): string {
  if (rev == null) return "";
  return field === "answer" ? (getAnswerText(step, rev) || "") : (getProblemText(step, rev) || "");
}

export function locateIssueRefSource(
  items: Record<string, Card>,
  parsed: IssueRef,
): { itemId: string; stepIndex: number; field: FieldName } | null {
  if (parsed.revision == null) return null;
  for (const item of Object.values(items)) {
    for (let stepIndex = 0; stepIndex < item.steps.length; stepIndex++) {
      const step = item.steps[stepIndex];
      if (!step) continue;
      for (const field of ["problem", "answer"] as const) {
        const text = field === "answer" ? (step.answer ?? "") : step.problem;
        if (text.includes(`@v${parsed.revision}`)) {
          return { itemId: item.id, stepIndex, field };
        }
      }
    }
  }
  return null;
}
