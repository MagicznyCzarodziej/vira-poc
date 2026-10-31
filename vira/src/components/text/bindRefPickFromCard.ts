import { isRefLinkableAnswer, isRefLinkableStep, type Card } from "../../domain/index.ts";
import { armEditHandoff } from "../card/AutoTextarea.tsx";
import { useDocument } from "../../store/useDocument.ts";
import { pickerOpen, usePanels } from "../../store/usePanels.ts";
import { insertRefToken } from "../panels/insertRefLink.ts";
import { completeIssueRefAtCursor, isTypingIssueRef } from "./autocompleteSuggestions.ts";
import { menuIsOpen } from "./mentionMenu.ts";

let composeTa: HTMLTextAreaElement | null = null;
let lastPickKey = "";
let lastPickAt = 0;

function syncComposeTa() {
  if (pickerOpen(usePanels.getState())) return;
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement && isTypingIssueRef(active)) {
    composeTa = active;
    return;
  }
  if (!menuIsOpen()) composeTa = null;
}

function refTokenFromPickTarget(target: HTMLElement, items: Record<string, Card>): string | null {
  const itemId = target.dataset.id;
  const stepIndex = Number(target.dataset.step);
  const field = target.dataset.refPick;
  if (!itemId || !Number.isFinite(stepIndex) || (field !== "problem" && field !== "answer")) return null;
  const step = items[itemId]?.steps[stepIndex];
  if (!step || !isRefLinkableStep(step)) return null;
  const stepNum = stepIndex + 1;
  if (field === "problem") return `${itemId}/${stepNum}`;
  if (isRefLinkableAnswer(step)) return `${itemId}/a${stepNum}`;
  return `${itemId}/${stepNum}`;
}

function refPickTarget(event: Event): HTMLElement | null {
  const target = event.target instanceof Element ? event.target : null;
  if (!target || target.closest("button, [data-action]")) return null;
  const pick = target.closest<HTMLElement>("[data-ref-pick]");
  if (!pick) return null;
  if (pick.closest(".card-readonly, .ref-link-picker-panel, .mention-menu, .selection-ref-toolbar")) return null;
  return pick;
}

function composeSource(): HTMLTextAreaElement | null {
  if (composeTa?.isConnected && isTypingIssueRef(composeTa)) return composeTa;
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement && isTypingIssueRef(active)) return active;
  return null;
}

export function refPickModeActive(): boolean {
  if (pickerOpen(usePanels.getState())) return true;
  if (composeSource()) return true;
  if (menuIsOpen() && composeTa?.isConnected) return true;
  return false;
}

export function tryConsumeRefPick(event: Event): boolean {
  if (!refPickModeActive()) return false;
  const editable = refPickTarget(event);
  if (!editable) return false;

  const token = refTokenFromPickTarget(editable, useDocument.getState().items);
  if (!token) return false;

  const pickKey = `${token}:${editable.dataset.id}:${editable.dataset.step}:${editable.dataset.refPick}`;
  const now = Date.now();
  const duplicate = pickKey === lastPickKey && now - lastPickAt < 600;
  event.preventDefault();
  event.stopPropagation();
  if ("stopImmediatePropagation" in event) event.stopImmediatePropagation();
  if (duplicate) return true;

  const picking = pickerOpen(usePanels.getState());
  lastPickKey = pickKey;
  lastPickAt = now;

  if (picking) {
    insertRefToken(token);
    return true;
  }

  const source = composeSource();
  if (!source) return false;
  armEditHandoff(true);
  const ok = completeIssueRefAtCursor(source, token);
  armEditHandoff(false);
  if (ok) composeTa = source;
  return ok;
}

export function bindRefPickFromCard(): () => void {
  const onCompose = () => syncComposeTa();
  const onPick = (event: Event) => {
    tryConsumeRefPick(event);
  };

  document.addEventListener("input", onCompose, true);
  document.addEventListener("focusin", onCompose, true);
  document.addEventListener("pointerdown", onPick, true);
  return () => {
    document.removeEventListener("input", onCompose, true);
    document.removeEventListener("focusin", onCompose, true);
    document.removeEventListener("pointerdown", onPick, true);
    composeTa = null;
  };
}
