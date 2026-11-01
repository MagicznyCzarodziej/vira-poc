import { refTokenFromRefPickElement } from "./issueRefLinkDrag.ts";
import { armEditHandoff } from "../card/AutoTextarea.tsx";
import { useDocument } from "../../store/index.ts";
import { pickerOpen, usePanels } from "../../store/index.ts";
import { insertRefToken } from "../panels/insertRefLink.ts";
import { completeIssueRefAtCursor, isTypingIssueRef } from "./autocompleteSuggestions.ts";
import { autocompleteOptsForTextarea } from "./textareaComposeSync.ts";
import {
  clearRefPickSuppressOnInput,
  isRefPickSuppressed,
  suppressRefPickAfterInsert,
  syncRefPickBodyClass,
} from "./refPickSession.ts";

let composeTa: HTMLTextAreaElement | null = null;
let lastPickKey = "";
let lastPickAt = 0;

export function syncRefPickActiveClass(): void {
  syncRefPickBodyClass(refPickModeActive());
}

/** Leave ref-pick mode after a reference was inserted or pick flow finished. */
export function endRefPickSession(): void {
  clearRefPickCompose();
  suppressRefPickAfterInsert();
  syncRefPickActiveClass();
}

function syncComposeTa() {
  if (pickerOpen(usePanels.getState())) return;
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement && isTypingIssueRef(active)) {
    composeTa = active;
    return;
  }
  composeTa = null;
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

export function clearRefPickCompose(): void {
  composeTa = null;
}

export function refPickModeActive(): boolean {
  if (isRefPickSuppressed()) return false;
  if (pickerOpen(usePanels.getState())) return true;
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement && isTypingIssueRef(active)) return true;
  return false;
}

export function tryConsumeRefPick(event: Event): boolean {
  if (!refPickModeActive()) return false;
  const editable = refPickTarget(event);
  if (!editable) return false;

  const token = refTokenFromRefPickElement(editable, useDocument.getState().items);
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
  const ok = completeIssueRefAtCursor(source, token, autocompleteOptsForTextarea(source));
  armEditHandoff(false);
  if (ok) endRefPickSession();
  return ok;
}

export function bindRefPickFromCard(): () => void {
  const onCompose = () => {
    clearRefPickSuppressOnInput();
    syncRefPickActiveClass();
    syncComposeTa();
  };
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
