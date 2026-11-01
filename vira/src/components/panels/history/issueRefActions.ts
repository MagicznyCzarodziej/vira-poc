import {
  findIssueRefTextHost,
  formatIssueRefToken,
  issueRefSameTarget,
  issueRefUpgradeHeadRev,
  parseIssueRef,
  type IssueRef,
  type IssueRefTextHost,
} from "../../../domain/index.ts";
import { requestCanvasReveal } from "../../canvas/flyToCard.ts";
import { useDocument } from "../../../store/index.ts";
import { usePanels } from "../../../store/index.ts";
import { commitIssueRefUpgrade } from "../../../domain/index.ts";
import { revealCardInList } from "./revealCardInList.ts";

let rememberedSource: { token: string; source: IssueRefTextHost } | null = null;

function sourceFrom(button: HTMLElement | null): IssueRefTextHost | null {
  const placedNote = button?.closest<HTMLElement>(".canvas-placed-note");
  const noteId = placedNote?.dataset.canvasPlaced;
  if (noteId && useDocument.getState().notes[noteId]) {
    return { kind: "note", noteId };
  }
  const sticky = button?.closest<HTMLElement>(".canvas-sticky-note[data-note-id]");
  const stickyId = sticky?.dataset.noteId;
  if (stickyId && useDocument.getState().notes[stickyId]) {
    return { kind: "note", noteId: stickyId };
  }
  const editable = button?.closest<HTMLElement>("[data-editable]");
  const field = editable?.dataset.editable;
  const itemId = editable?.dataset.id;
  const stepIndex = Number(editable?.dataset.step);
  if (field === "noteBody" && itemId && useDocument.getState().notes[itemId]) {
    return { kind: "note", noteId: itemId };
  }
  if ((field === "problem" || field === "answer") && itemId && Number.isFinite(stepIndex)) {
    return { kind: "card", itemId, stepIndex, field };
  }
  const followup = button?.closest<HTMLElement>("[data-followup-input]");
  const followupId = followup instanceof HTMLTextAreaElement ? followup.dataset.id : followup?.dataset.id;
  if (followupId) return { kind: "followup", itemId: followupId };
  return null;
}

function upgradePin(token: string, button: HTMLElement | null) {
  const parsed = parseIssueRef(token);
  if (!parsed || parsed.revision == null || parsed.stepIndex == null) return;
  const doc = useDocument.getState();
  const savedSource = rememberedSource && issueRefSameTarget(parseIssueRef(rememberedSource.token), parsed)
    ? rememberedSource.source
    : null;
  const preferred =
    sourceFrom(button)
    ?? savedSource
    ?? findIssueRefTextHost(doc.items, doc.notes, doc.followupDrafts, parsed);
  if (!commitIssueRefUpgrade(
    {
      items: doc.items,
      notes: doc.notes,
      followupDrafts: doc.followupDrafts,
      setNoteBody: (noteId, body) => useDocument.getState().setNoteBody(noteId, body),
      setFollowupDraft: (itemId, value) => useDocument.getState().setFollowupDraft(itemId, value),
      setFieldHeadText: (itemId, stepIndex, field, text) =>
        useDocument.getState().setFieldHeadText(itemId, stepIndex, field, text),
    },
    parsed,
    preferred,
  )) return;
  const head = issueRefUpgradeHeadRev(doc.items, parsed);
  const openId = usePanels.getState().drawerRefId;
  const openParsed = openId ? parseIssueRef(openId) : null;
  if (openParsed && head != null && issueRefSameTarget(openParsed, parsed)) {
    usePanels.getState().openDrawer(formatIssueRefToken({ ...parsed, revision: head }));
  }
}

export function bindIssueRefActions(): () => void {
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || usePanels.getState().picker || !usePanels.getState().drawerRefId) return;
    const target = event.target;
    if (target instanceof Element && target.closest("textarea, input:not([type='button'])")) return;
    usePanels.getState().closeDrawer();
  };
  const onOpen = (event: Event) => {
    const id = (event as CustomEvent<{ refId?: string }>).detail?.refId;
    if (id) usePanels.getState().openDrawer(id);
  };
  const onClick = (event: MouseEvent) => {
    const button = (event.target as Element | null)?.closest?.<HTMLElement>("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    if (action === "close-issue-drawer") {
      event.preventDefault();
      event.stopPropagation();
      usePanels.getState().closeDrawer();
      return;
    }
    if (action === "open-card-history") {
      const id = button.dataset.id;
      if (!id) return;
      event.preventDefault();
      event.stopPropagation();
      usePanels.getState().openDrawer(id);
      return;
    }
    if (action === "upgrade-issue-ref") {
      event.preventDefault();
      event.stopPropagation();
      upgradePin(button.dataset.issueRef || usePanels.getState().drawerRefId || "", button);
      return;
    }
    if (action !== "goto-issue") return;
    const token = button.dataset.issueRef;
    if (!token) return;
    const ref = parseIssueRef(token);
    if (!ref) return;
    if (event.shiftKey && button.classList.contains("issue-ref-stale")) {
      event.preventDefault();
      event.stopPropagation();
      upgradePin(token, button);
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      const id = ref.itemId;
      if (useDocument.getState().viewMode !== "list") useDocument.getState().setView("list");
      requestCanvasReveal(id);
      revealCardInList(id);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const doc = useDocument.getState();
    const source =
      sourceFrom(button)
      ?? findIssueRefTextHost(doc.items, doc.notes, doc.followupDrafts, ref);
    rememberedSource = source ? { token, source } : null;
    usePanels.getState().openDrawer(token);
  };
  window.addEventListener("keydown", onKey);
  window.addEventListener("vira:open-drawer", onOpen);
  document.addEventListener("click", onClick, true);
  return () => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("vira:open-drawer", onOpen);
    document.removeEventListener("click", onClick, true);
  };
}
