import { clearActionPointLinkDragGhost } from "./actionPointLinkDragGhost.ts";
import { useDocument } from "../../store/index.ts";

export const AP_LINK_DRAG_BODY_CLASS = "ap-link-drag-active";
export const AP_LINK_DROP_TARGET_CLASS = "ap-link-drop-target";

export type DecisionAnswerLinkTarget = { itemId: string; stepIndex: number };

let highlightedDrop: HTMLElement | null = null;

function elementAt(clientX: number, clientY: number): Element | null {
  if (typeof document.elementFromPoint !== "function") return null;
  return document.elementFromPoint(clientX, clientY);
}

export function findDecisionAnswerLinkTarget(
  clientX: number,
  clientY: number,
): DecisionAnswerLinkTarget | null {
  const hit = elementAt(clientX, clientY);
  if (!hit) return null;
  const answerBlock = hit.closest<HTMLElement>(".answer-block");
  if (!answerBlock || answerBlock.closest(".card-readonly")) return null;
  const card = answerBlock.closest<HTMLElement>(".card");
  const itemId = card?.dataset.id;
  const stepRaw = answerBlock.dataset.step;
  if (!itemId || stepRaw == null) return null;
  const stepIndex = Number.parseInt(stepRaw, 10);
  if (!Number.isFinite(stepIndex)) return null;
  return { itemId, stepIndex };
}

export function clearActionPointLinkDropHighlight(): void {
  highlightedDrop?.classList.remove(AP_LINK_DROP_TARGET_CLASS);
  highlightedDrop = null;
}

export function syncActionPointLinkDropHighlight(clientX: number, clientY: number): void {
  const hit = elementAt(clientX, clientY);
  let block = hit?.closest<HTMLElement>(".answer-block") ?? null;
  if (block?.closest(".card-readonly")) block = null;
  if (highlightedDrop === block) return;
  highlightedDrop?.classList.remove(AP_LINK_DROP_TARGET_CLASS);
  highlightedDrop = block;
  block?.classList.add(AP_LINK_DROP_TARGET_CLASS);
}

export function beginActionPointLinkDrag(): void {
  document.body.classList.add(AP_LINK_DRAG_BODY_CLASS);
}

export function endActionPointLinkDrag(): void {
  document.body.classList.remove(AP_LINK_DRAG_BODY_CLASS);
  clearActionPointLinkDropHighlight();
  clearActionPointLinkDragGhost();
}

export function finishActionPointLinkDrop(actionPointId: string, clientX: number, clientY: number): boolean {
  const target = findDecisionAnswerLinkTarget(clientX, clientY);
  if (!target) return false;
  return useDocument.getState().linkActionPointToDecision(
    actionPointId,
    target.itemId,
    target.stepIndex,
  );
}
