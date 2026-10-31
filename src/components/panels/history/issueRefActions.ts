import { issueRefHrefNeedles, issueRefSameTarget } from "../../../domain/index.ts";
import {
  formatIssueRefToken,
  getAnswerText,
  getProblemText,
  isIssueRefStale,
  parseIssueRef,
  refTargetStep,
  replaceIssueRefRevisionInText,
  stepFieldHeadRev,
  type Card,
  type FieldName,
  type IssueRef,
} from "../../../domain/index.ts";
import { requestCanvasReveal } from "../../canvas/flyToCard.ts";
import { useDocument } from "../../../store/index.ts";
import { usePanels } from "../../../store/index.ts";
import { revealCardInList } from "./revealCardInList.ts";

type FieldSource = { itemId: string; stepIndex: number; field: FieldName };

let rememberedSource: { token: string; source: FieldSource } | null = null;

function sourceFrom(button: HTMLElement | null): FieldSource | null {
  const editable = button?.closest<HTMLElement>("[data-editable]");
  const field = editable?.dataset.editable;
  const itemId = editable?.dataset.id;
  const stepIndex = Number(editable?.dataset.step);
  if ((field === "problem" || field === "answer") && itemId && Number.isFinite(stepIndex)) {
    return { itemId, stepIndex, field };
  }
  return null;
}

function findSource(items: Record<string, Card>, parsed: IssueRef): FieldSource | null {
  const needles = issueRefHrefNeedles(parsed);
  if (!needles.length) return null;
  for (const card of Object.values(items)) {
    for (let stepIndex = 0; stepIndex < card.steps.length; stepIndex += 1) {
      const step = card.steps[stepIndex];
      if (!step) continue;
      for (const field of ["problem", "answer"] as const) {
        const text = field === "answer" ? (step.answer ?? "") : step.problem;
        if (text && needles.some((needle) => text.includes(needle))) return { itemId: card.id, stepIndex, field };
      }
    }
  }
  return null;
}

function upgradePin(token: string, button: HTMLElement | null) {
  const parsed = parseIssueRef(token);
  if (!parsed || parsed.revision == null || parsed.stepIndex == null) return;
  const doc = useDocument.getState();
  if (typeof doc.setFieldHeadText !== "function") return;
  if (!isIssueRefStale(doc.items, parsed)) return;
  const target = refTargetStep(doc.items, parsed);
  if (!target) return;
  const head = stepFieldHeadRev(target.step, target.field);
  const savedSource = rememberedSource && issueRefSameTarget(parseIssueRef(rememberedSource.token), parsed)
    ? rememberedSource.source
    : null;
  const source = sourceFrom(button) ?? savedSource ?? findSource(doc.items, parsed);
  if (!source) return;
  const step = doc.items[source.itemId]?.steps[source.stepIndex];
  if (!step) return;
  const before = source.field === "answer"
    ? (getAnswerText(step) ?? step.answer ?? "")
    : (getProblemText(step) ?? step.problem ?? "");
  const updated = replaceIssueRefRevisionInText(before, parsed, head);
  if (updated === before) return;
  doc.setFieldHeadText(source.itemId, source.stepIndex, source.field, updated);
  const openId = usePanels.getState().drawerRefId;
  const openParsed = openId ? parseIssueRef(openId) : null;
  if (openParsed && issueRefSameTarget(openParsed, parsed)) {
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
    const source = sourceFrom(button) ?? findSource(useDocument.getState().items, ref);
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
