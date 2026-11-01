import {
  buildIssueRefMarkdown,
  getAnswerText,
  getProblemText,
  isRefLinkableAnswer,
  isRefLinkableStep,
  type Card,
  type FieldName,
} from "../../domain/index.ts";
import { normalizeRefTokenForField } from "../../domain/index.ts";
import { armEditHandoff } from "../card/AutoTextarea.tsx";
import { useDocument } from "../../store/index.ts";
import { autocompleteOptsForTextarea } from "./textareaComposeSync.ts";
import { clearIssueRefLinkDragGhost } from "../canvas/issueRefLinkDragGhost.ts";
import { isRefEditableTextarea } from "./selectionGeometry.ts";

export const ISSUE_REF_LINK_DROP_CLASS = "issue-ref-link-drop-target";
export const ISSUE_REF_LINK_DRAG_BODY_CLASS = "issue-ref-link-drag-active";

export type IssueRefLinkSource = {
  refToken: string;
  itemId: string;
  stepIndex: number;
  field: FieldName;
};

let highlightedDrop: HTMLElement | null = null;

function elementAt(clientX: number, clientY: number): Element | null {
  if (typeof document.elementFromPoint !== "function") return null;
  return document.elementFromPoint(clientX, clientY);
}

export function refTokenFromRefPickElement(
  pick: HTMLElement,
  items: Record<string, Card>,
): string | null {
  const itemId = pick.dataset.id;
  const stepIndex = Number(pick.dataset.step);
  const field = pick.dataset.refPick;
  if (!itemId || !Number.isFinite(stepIndex) || (field !== "problem" && field !== "answer")) return null;
  const step = items[itemId]?.steps[stepIndex];
  if (!step || !isRefLinkableStep(step)) return null;
  const stepNum = stepIndex + 1;
  if (field === "problem") return `${itemId}/${stepNum}`;
  if (isRefLinkableAnswer(step)) return `${itemId}/a${stepNum}`;
  return `${itemId}/${stepNum}`;
}

export function issueRefLinkSourceFromTarget(target: EventTarget | null): IssueRefLinkSource | null {
  if (!(target instanceof Element)) return null;
  if (target.closest("button, [data-action]")) return null;
  const pick = target.closest<HTMLElement>("[data-ref-pick]");
  if (!pick || pick.closest(".card-readonly, .ref-link-picker-panel")) return null;
  const items = useDocument.getState().items;
  const refToken = refTokenFromRefPickElement(pick, items);
  if (!refToken) return null;
  const field = pick.dataset.refPick === "answer" ? "answer" : "problem";
  const stepIndex = Number(pick.dataset.step);
  const itemId = pick.dataset.id!;
  return { refToken, itemId, stepIndex, field };
}

export function issueRefLinkSourceFromPlacedCard(
  placedEl: HTMLElement,
  items: Record<string, Card>,
): IssueRefLinkSource | null {
  const itemId = placedEl.dataset.canvasItemId ?? placedEl.querySelector<HTMLElement>(".card")?.dataset.id;
  if (!itemId) return null;
  const refToken = defaultRefTokenForCardItem(itemId, items);
  if (!refToken) return null;
  const field: FieldName = refToken.includes("/a") ? "answer" : "problem";
  return { refToken, itemId, stepIndex: 0, field };
}

export function defaultRefTokenForCardItem(itemId: string, items: Record<string, Card>): string | null {
  const item = items[itemId];
  const step = item?.steps[0];
  if (!step || !isRefLinkableStep(step)) return null;
  if (isRefLinkableAnswer(step)) return `${itemId}/a1`;
  if (getProblemText(step).trim()) return `${itemId}/1`;
  return `${itemId}/1`;
}

function refSuggestContextForTextarea(ta: HTMLTextAreaElement) {
  if (ta.dataset.noteId) return undefined;
  const field = ta.dataset.refField;
  const hostItemId = ta.dataset.refItemId || ta.dataset.id;
  if (field === "answer" || field === "problem") {
    return hostItemId ? { field, hostItemId } : { field };
  }
  return hostItemId ? { hostItemId } : undefined;
}

function persistTextareaValue(ta: HTMLTextAreaElement, next: string, cursor: number): void {
  const noteId = ta.dataset.noteId;
  if (noteId) {
    useDocument.getState().setNoteBody(noteId, next);
  }
  if (ta.matches("[data-followup-input]")) {
    const id = ta.dataset.id;
    if (id) useDocument.getState().setFollowupDraft(id, next);
  }
  const refField = ta.dataset.refField;
  const itemId = ta.dataset.refItemId || ta.dataset.id;
  const stepRaw = ta.dataset.refStep;
  if (refField === "problem" || refField === "answer") {
    const stepIndex = stepRaw != null ? Number(stepRaw) : NaN;
    if (itemId && Number.isFinite(stepIndex)) {
      const doc = useDocument.getState();
      const editing = doc.editing;
      if (
        editing?.id === itemId
        && editing.field === refField
        && editing.step === stepIndex
      ) {
        doc.commitEdit(next);
      } else {
        doc.setFieldHeadText(itemId, stepIndex, refField, next);
      }
    }
  }
  armEditHandoff(true);
  ta.focus();
  ta.setSelectionRange(cursor, cursor);
  window.requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(cursor, cursor);
    armEditHandoff(false);
  });
}

function insertAtForTextarea(ta: HTMLTextAreaElement, clientX: number, clientY: number): number {
  if (typeof document.caretPositionFromPoint === "function") {
    const pos = document.caretPositionFromPoint(clientX, clientY);
    if (pos?.offsetNode && ta.contains(pos.offsetNode)) {
      let offset = pos.offset;
      const node = pos.offsetNode;
      if (node.nodeType === Node.TEXT_NODE && node.parentElement && node.parentElement !== ta) {
        const walker = document.createTreeWalker(ta, NodeFilter.SHOW_TEXT);
        let seen = 0;
        while (walker.nextNode()) {
          const current = walker.currentNode;
          if (current === node) {
            offset = seen + pos.offset;
            break;
          }
          seen += current.textContent?.length ?? 0;
        }
      }
      return Math.max(0, Math.min(offset, ta.value.length));
    }
  }
  ta.focus();
  return ta.selectionStart ?? ta.value.length;
}

function isNoteTextarea(ta: HTMLTextAreaElement): boolean {
  return !!ta.dataset.noteId;
}

function isRefDropTextarea(ta: HTMLTextAreaElement | null): ta is HTMLTextAreaElement {
  return !!ta && (isRefEditableTextarea(ta) || isNoteTextarea(ta));
}

export function findIssueRefLinkDropTarget(
  clientX: number,
  clientY: number,
): { ta: HTMLTextAreaElement; insertAt: number } | { field: IssueRefLinkSource } | null {
  const hit = elementAt(clientX, clientY);
  if (!hit) return null;

  const directTa = hit.closest("textarea");
  if (isRefDropTextarea(directTa)) {
    return { ta: directTa, insertAt: insertAtForTextarea(directTa, clientX, clientY) };
  }

  const noteHost = hit.closest<HTMLElement>(".canvas-placed-note");
  if (noteHost) {
    const ta = noteHost.querySelector<HTMLTextAreaElement>("textarea[data-note-id]");
    if (ta) return { ta, insertAt: insertAtForTextarea(ta, clientX, clientY) };
  }

  const pick = hit.closest<HTMLElement>("[data-ref-pick]");
  if (pick && !pick.closest(".card-readonly, .ref-link-picker-panel")) {
    const source = issueRefLinkSourceFromTarget(pick);
    if (source) return { field: source };
  }

  return null;
}

function sameSourceAndTarget(source: IssueRefLinkSource, target: IssueRefLinkSource): boolean {
  return (
    source.itemId === target.itemId
    && source.stepIndex === target.stepIndex
    && source.field === target.field
  );
}

export function insertIssueRefAtTextarea(
  ta: HTMLTextAreaElement,
  insertAt: number,
  refToken: string,
): boolean {
  const items = useDocument.getState().items;
  const markdown = buildIssueRefMarkdown(
    items,
    normalizeRefTokenForField(refToken, refSuggestContextForTextarea(ta)),
    "",
  );
  if (!markdown) return false;
  const value = ta.value;
  const prefix = value.slice(0, insertAt);
  const suffix = value.slice(insertAt);
  const sep = prefix.length > 0 && !/\s$/.test(prefix) ? " " : "";
  const insert = `${sep}${markdown} `;
  const next = `${prefix}${insert}${suffix}`;
  const cursor = prefix.length + insert.length;
  const opts = autocompleteOptsForTextarea(ta);
  if (opts?.onValue) {
    opts.onValue(next, cursor);
  } else {
    const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
    proto?.set?.call(ta, next);
  }
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  persistTextareaValue(ta, next, cursor);
  return true;
}

function appendRefToCardField(target: IssueRefLinkSource, refToken: string): boolean {
  const items = useDocument.getState().items;
  const markdown = buildIssueRefMarkdown(
    items,
    normalizeRefTokenForField(refToken, { field: target.field }),
    "",
  );
  if (!markdown) return false;
  const step = items[target.itemId]?.steps[target.stepIndex];
  if (!step) return false;
  const current =
    target.field === "answer"
      ? (getAnswerText(step) ?? step.answer ?? "")
      : (getProblemText(step) ?? step.problem ?? "");
  const sep = current.trim() ? " " : "";
  const next = `${current}${sep}${markdown} `;
  useDocument.getState().setFieldHeadText(target.itemId, target.stepIndex, target.field, next);
  return true;
}

export function finishIssueRefLinkDrop(
  source: IssueRefLinkSource,
  clientX: number,
  clientY: number,
): boolean {
  const drop = findIssueRefLinkDropTarget(clientX, clientY);
  if (!drop) return false;
  if ("field" in drop) {
    if (sameSourceAndTarget(source, drop.field)) return false;
    return appendRefToCardField(drop.field, source.refToken);
  }
  return insertIssueRefAtTextarea(drop.ta, drop.insertAt, source.refToken);
}

export function clearIssueRefLinkDropHighlight(): void {
  highlightedDrop?.classList.remove(ISSUE_REF_LINK_DROP_CLASS);
  highlightedDrop = null;
}

export function syncIssueRefLinkDropHighlight(clientX: number, clientY: number): void {
  const drop = findIssueRefLinkDropTarget(clientX, clientY);
  let next: HTMLElement | null = null;
  if (drop && "ta" in drop) next = drop.ta;
  else if (drop && "field" in drop) {
    const hit = elementAt(clientX, clientY);
    next = hit?.closest<HTMLElement>("[data-ref-pick]") ?? null;
  }
  if (highlightedDrop === next) return;
  highlightedDrop?.classList.remove(ISSUE_REF_LINK_DROP_CLASS);
  highlightedDrop = next;
  next?.classList.add(ISSUE_REF_LINK_DROP_CLASS);
}

export function beginIssueRefLinkDrag(): void {
  document.body.classList.add(ISSUE_REF_LINK_DRAG_BODY_CLASS);
}

export function endIssueRefLinkDrag(): void {
  document.body.classList.remove(ISSUE_REF_LINK_DRAG_BODY_CLASS);
  clearIssueRefLinkDropHighlight();
  clearIssueRefLinkDragGhost();
}
