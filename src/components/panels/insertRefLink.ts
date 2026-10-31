import { buildIssueRefMarkdown, type FieldName } from "../../domain/index.ts";
import { normalizeRefTokenForField } from "../../domain/index.ts";
import { armEditHandoff } from "../card/AutoTextarea.tsx";
import { useDocument } from "../../store/index.ts";
import { usePanels, type PickerSession } from "../../store/index.ts";

type OpenDetail = Partial<PickerSession> & {
  textarea?: HTMLTextAreaElement;
  label?: string;
};

let boundTextarea: HTMLTextAreaElement | null = null;

export function capturePickerSession(detail: OpenDetail): PickerSession | null {
  if (typeof detail.label !== "string") return null;
  const ta = detail.textarea instanceof HTMLTextAreaElement
    ? detail.textarea
    : document.activeElement instanceof HTMLTextAreaElement
      ? document.activeElement
      : null;
  boundTextarea = ta;
  const mode = detail.mode
    ?? (ta?.matches("[data-composer-input]")
      ? "composer"
      : ta?.matches("[data-followup-input]")
        ? "followup"
        : "inline");
  const rawField = detail.field ?? ta?.dataset.refField;
  const field: FieldName | undefined = rawField === "problem" || rawField === "answer" ? rawField : undefined;
  const rawStep = detail.stepIndex ?? (ta?.dataset.refStep ? Number(ta.dataset.refStep) : undefined);
  const stepIndex = rawStep != null && Number.isFinite(rawStep) ? rawStep : undefined;
  return {
    label: detail.label,
    start: detail.start ?? ta?.selectionStart ?? 0,
    end: detail.end ?? ta?.selectionEnd ?? detail.start ?? ta?.selectionStart ?? 0,
    textSnapshot: detail.textSnapshot ?? ta?.value ?? "",
    mode,
    itemId: detail.itemId ?? ta?.dataset.refItemId ?? ta?.dataset.id,
    field,
    stepIndex,
    canvas: detail.canvas ?? !!ta?.closest(".canvas-placed-card"),
  };
}

function setNativeValue(ta: HTMLTextAreaElement, value: string) {
  const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
  proto?.set?.call(ta, value);
  ta.dispatchEvent(new Event("input", { bubbles: true }));
}

function findTextarea(pick: PickerSession): HTMLTextAreaElement | null {
  if (boundTextarea?.isConnected) return boundTextarea;
  if (pick.mode === "composer") return document.querySelector<HTMLTextAreaElement>("[data-composer-input]");
  if (!pick.itemId) return null;
  const id = CSS.escape(pick.itemId);
  if (pick.mode === "followup") {
    const scoped = pick.canvas
      ? document.querySelector<HTMLTextAreaElement>(`.canvas-placed-card[data-canvas-placed="${id}"] [data-followup-input][data-id="${id}"]`)
      : null;
    return scoped ?? document.querySelector<HTMLTextAreaElement>(`[data-followup-input][data-id="${id}"]`);
  }
  if (pick.field == null || pick.stepIndex == null) return null;
  const selector = `textarea[data-ref-item-id="${id}"][data-ref-field="${pick.field}"][data-ref-step="${pick.stepIndex}"]`;
  const root = pick.canvas ? document.querySelector(`.canvas-placed-card[data-canvas-placed="${id}"]`) : document;
  return root?.querySelector<HTMLTextAreaElement>(selector) ?? null;
}

function applyPickedText(pick: PickerSession, next: string, markdownLen: number): void {
  if (pick.mode === "followup" && pick.itemId) {
    useDocument.getState().setFollowupDraft(pick.itemId, next);
  }

  const ta = findTextarea(pick);
  const caret = pick.start + markdownLen;
  const focusAt = (el: HTMLTextAreaElement) => {
    if (!el.isConnected) return;
    el.focus();
    el.setSelectionRange(caret, caret);
  };

  if (ta?.isConnected) {
    armEditHandoff(true);
    setNativeValue(ta, next);
    focusAt(ta);
    window.requestAnimationFrame(() => {
      focusAt(ta);
      armEditHandoff(false);
    });
    return;
  }

  const doc = useDocument.getState();
  const editing = doc.editing;
  if (
    pick.mode === "inline"
    && pick.itemId
    && pick.field
    && pick.stepIndex != null
    && editing?.id === pick.itemId
    && editing.field === pick.field
    && editing.step === pick.stepIndex
  ) {
    doc.commitEdit(next);
    return;
  }
  if (pick.mode === "inline" && pick.itemId && pick.field && pick.stepIndex != null) {
    doc.setFieldHeadText(pick.itemId, pick.stepIndex, pick.field, next);
    return;
  }
  if (pick.mode === "composer") {
    const composer = document.querySelector<HTMLTextAreaElement>("[data-composer-input]");
    if (composer?.isConnected) {
      setNativeValue(composer, next);
      focusAt(composer);
    }
  }
}

export function insertRefToken(token: string): void {
  const pick = usePanels.getState().picker;
  if (!pick) return;
  const items = useDocument.getState().items;
  const refContext = pick.field === "answer" || pick.field === "problem" ? { field: pick.field } : undefined;
  const markdown = buildIssueRefMarkdown(items, normalizeRefTokenForField(token, refContext), pick.label);
  if (!markdown) {
    usePanels.getState().closePicker();
    boundTextarea = null;
    return;
  }
  const next = `${pick.textSnapshot.slice(0, pick.start)}${markdown}${pick.textSnapshot.slice(pick.end)}`;
  usePanels.getState().closePicker();
  boundTextarea = null;
  applyPickedText(pick, next, markdown.length);
}
