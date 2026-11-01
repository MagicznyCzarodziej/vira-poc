import { isIssueRefStale } from "./refResolve.ts";
import { locateIssueRefSource } from "./refResolve.ts";
import { issueRefHrefNeedles, replaceIssueRefRevisionInText } from "./refSyntax.ts";
import { getAnswerText, getProblemText, stepFieldHeadRev } from "./stepRevisions.ts";
import type { Card, FieldName, IssueRef, Note } from "./types.ts";

export type IssueRefTextHost =
  | { kind: "card"; itemId: string; stepIndex: number; field: FieldName }
  | { kind: "note"; noteId: string }
  | { kind: "followup"; itemId: string };

function textContainsRefNeedle(text: string, parsed: IssueRef): boolean {
  const needles = issueRefHrefNeedles(parsed);
  return needles.some((needle) => text.includes(needle));
}

export function findIssueRefTextHost(
  items: Record<string, Card>,
  notes: Record<string, Note>,
  followupDrafts: Record<string, string>,
  parsed: IssueRef,
): IssueRefTextHost | null {
  const needles = issueRefHrefNeedles(parsed);
  if (!needles.length) return null;

  for (const note of Object.values(notes)) {
    if (textContainsRefNeedle(note.body, parsed)) return { kind: "note", noteId: note.id };
  }
  for (const [itemId, draft] of Object.entries(followupDrafts)) {
    if (draft && textContainsRefNeedle(draft, parsed)) return { kind: "followup", itemId };
  }
  for (const item of Object.values(items)) {
    for (let stepIndex = 0; stepIndex < item.steps.length; stepIndex += 1) {
      const step = item.steps[stepIndex];
      if (!step) continue;
      for (const field of ["problem", "answer"] as const) {
        const text = field === "answer" ? (step.answer ?? "") : step.problem;
        if (text && textContainsRefNeedle(text, parsed)) {
          return { itemId: item.id, stepIndex, field, kind: "card" };
        }
      }
    }
  }
  if (parsed.revision != null) {
    const legacy = locateIssueRefSource(items, parsed);
    if (legacy) return { kind: "card", ...legacy };
  }
  return null;
}

export function readIssueRefHostText(
  host: IssueRefTextHost,
  items: Record<string, Card>,
  notes: Record<string, Note>,
  followupDrafts: Record<string, string>,
): string {
  if (host.kind === "note") return notes[host.noteId]?.body ?? "";
  if (host.kind === "followup") return followupDrafts[host.itemId] ?? "";
  const step = items[host.itemId]?.steps[host.stepIndex];
  if (!step) return "";
  return host.field === "answer"
    ? (getAnswerText(step) ?? step.answer ?? "")
    : (getProblemText(step) ?? step.problem ?? "");
}

export function issueRefUpgradeHeadRev(items: Record<string, Card>, parsed: IssueRef): number | null {
  if (parsed.stepIndex == null) return null;
  const step = items[parsed.itemId]?.steps[parsed.stepIndex];
  if (!step) return null;
  const field: FieldName = parsed.focusAnswer ? "answer" : "problem";
  return stepFieldHeadRev(step, field);
}

export function applyIssueRefRevisionUpgrade(
  host: IssueRefTextHost,
  items: Record<string, Card>,
  notes: Record<string, Note>,
  followupDrafts: Record<string, string>,
  parsed: IssueRef,
  newRevision: number,
): { host: IssueRefTextHost; text: string } | null {
  const before = readIssueRefHostText(host, items, notes, followupDrafts);
  const updated = replaceIssueRefRevisionInText(before, parsed, newRevision);
  if (updated === before) return null;
  return { host, text: updated };
}

export type IssueRefUpgradeSink = {
  items: Record<string, Card>;
  notes: Record<string, Note>;
  followupDrafts: Record<string, string>;
  setNoteBody: (noteId: string, body: string) => void;
  setFollowupDraft: (itemId: string, value: string) => void;
  setFieldHeadText: (itemId: string, stepIndex: number, field: FieldName, text: string) => void;
};

export function commitIssueRefUpgrade(
  sink: IssueRefUpgradeSink,
  parsed: IssueRef,
  preferredHost?: IssueRefTextHost | null,
): boolean {
  if (parsed.revision == null || parsed.stepIndex == null) return false;
  if (!isIssueRefStale(sink.items, parsed)) return false;
  const head = issueRefUpgradeHeadRev(sink.items, parsed);
  if (head == null) return false;
  const host =
    preferredHost
    ?? findIssueRefTextHost(sink.items, sink.notes, sink.followupDrafts, parsed);
  if (!host) return false;
  const applied = applyIssueRefRevisionUpgrade(
    host,
    sink.items,
    sink.notes,
    sink.followupDrafts,
    parsed,
    head,
  );
  if (!applied) return false;
  if (applied.host.kind === "note") {
    sink.setNoteBody(applied.host.noteId, applied.text);
    return true;
  }
  if (applied.host.kind === "followup") {
    sink.setFollowupDraft(applied.host.itemId, applied.text);
    return true;
  }
  sink.setFieldHeadText(applied.host.itemId, applied.host.stepIndex, applied.host.field, applied.text);
  return true;
}
