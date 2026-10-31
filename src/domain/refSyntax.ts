import { cardNumber } from "./stepStatus.ts";
import type { IssueRef } from "./types.ts";

export function normalizeIssueId(ref: string | null | undefined): string | null {
  const value = String(ref ?? "").trim();
  const match = value.match(/^item-(\d+)$/i) || value.match(/^(\d+)$/);
  return match ? `item-${match[1]}` : null;
}

export function parseIssueRef(ref: string | null | undefined): IssueRef | null {
  const value = String(ref ?? "").trim().replace(/^!+/, "");
  const match = value.match(/^(?:(item-\d+)|(\d+))(?:\/(?:step-)?(\d+)|\/a(\d+))?(?:@v(\d+))?$/i);
  if (!match) {
    const itemId = normalizeIssueId(value.replace(/@v\d+$/i, ""));
    return itemId ? { itemId, stepIndex: null, focusAnswer: false, revision: null } : null;
  }
  const itemId = normalizeIssueId(match[1] || match[2]);
  if (!itemId) return null;
  let stepIndex: number | null = null;
  let focusAnswer = false;
  if (match[3]) {
    const stepNum = parseInt(match[3], 10);
    if (stepNum >= 1) stepIndex = stepNum - 1;
  } else if (match[4]) {
    const stepNum = parseInt(match[4], 10);
    if (stepNum >= 1) {
      stepIndex = stepNum - 1;
      focusAnswer = true;
    }
  }
  const revision = match[5] ? parseInt(match[5], 10) : null;
  return { itemId, stepIndex, focusAnswer, revision };
}

export function formatIssueRefSuffix(parsed: IssueRef): string {
  return parsed.revision != null ? `@v${parsed.revision}` : "";
}

export function formatIssueRefToken(parsed: IssueRef): string {
  const num = cardNumber(parsed.itemId);
  const suffix = formatIssueRefSuffix(parsed);
  if (parsed.focusAnswer && parsed.stepIndex != null) return `item-${num}/a${parsed.stepIndex + 1}${suffix}`;
  if (parsed.stepIndex != null) return `item-${num}/${parsed.stepIndex + 1}${suffix}`;
  return parsed.itemId;
}

export function formatIssueRefDisplay(parsed: IssueRef): string {
  const num = cardNumber(parsed.itemId);
  if (parsed.focusAnswer && parsed.stepIndex != null) return `!${num}/a${parsed.stepIndex + 1}`;
  if (parsed.stepIndex != null) return `!${num}/${parsed.stepIndex + 1}`;
  return `!${num}`;
}

export function formatIssueRefInText(parsed: IssueRef): string {
  return `${formatIssueRefDisplay(parsed)}${formatIssueRefSuffix(parsed)}`;
}

export function issueRefPartsToToken(
  num: string,
  stepNum?: string,
  answerNum?: string,
  revisionNum?: string,
): string {
  const base = answerNum ? `${num}/a${answerNum}` : stepNum ? `${num}/${stepNum}` : num;
  return revisionNum ? `${base}@v${revisionNum}` : base;
}

export function issueRefSameTarget(a: IssueRef | null, b: IssueRef | null): boolean {
  if (!a || !b) return false;
  return a.itemId === b.itemId && a.stepIndex === b.stepIndex && !!a.focusAnswer === !!b.focusAnswer;
}

export function issueRefHrefNeedles(parsed: IssueRef): string[] {
  if (parsed.revision == null) return [];
  const num = cardNumber(parsed.itemId);
  const suffix = `@v${parsed.revision}`;
  const needles = new Set<string>([formatIssueRefInText({ ...parsed, revision: parsed.revision })]);
  if (parsed.focusAnswer && parsed.stepIndex != null) {
    const sn = parsed.stepIndex + 1;
    needles.add(`!${num}/a${sn}${suffix}`);
    needles.add(`#${num}/a${sn}${suffix}`);
    needles.add(`item-${num}/a${sn}${suffix}`);
    needles.add(`${num}/a${sn}${suffix}`);
  } else if (parsed.stepIndex != null) {
    const sn = parsed.stepIndex + 1;
    needles.add(`!${num}/${sn}${suffix}`);
    needles.add(`#${num}/${sn}${suffix}`);
    needles.add(`item-${num}/${sn}${suffix}`);
    needles.add(`${num}/${sn}${suffix}`);
  } else {
    needles.add(`!${num}${suffix}`);
    needles.add(`#${num}${suffix}`);
    needles.add(`item-${num}${suffix}`);
    needles.add(`${num}${suffix}`);
  }
  return [...needles];
}

function issueRefNewHrefForNeedle(needle: string, next: IssueRef): string {
  const display = formatIssueRefInText(next);
  if (needle.startsWith("item-")) return formatIssueRefToken(next);
  if (needle.startsWith("!") || needle.startsWith("#")) return display;
  return display.replace(/^!/, "");
}

export function replaceIssueRefRevisionInText(text: string, parsed: IssueRef, newRevision: number): string {
  const next = { ...parsed, revision: newRevision };
  const needles = issueRefHrefNeedles(parsed);
  if (!needles.length) return text;
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let out = text;
  for (const oldHref of needles) {
    const newHref = issueRefNewHrefForNeedle(oldHref, next);
    if (oldHref === newHref) continue;
    out = out
      .replace(new RegExp(`\\(${escape(oldHref)}\\)`, "g"), `(${newHref})`)
      .replace(new RegExp(escape(oldHref), "g"), newHref);
  }
  return out;
}

export function truncateLabel(text: string | null | undefined, max = 52): string {
  if (!text || text.length <= max) return text ?? "";
  return `${text.slice(0, max - 1)}…`;
}
