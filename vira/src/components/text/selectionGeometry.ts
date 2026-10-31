const REF_TEXTAREA = "textarea.inline-input, textarea[data-composer-input], textarea[data-followup-input]";

export type SelectionAnchor = {
  textarea: HTMLTextAreaElement;
  start: number;
  end: number;
  label: string;
  x: number;
  y: number;
};

export function isRefEditableTextarea(ta: unknown): ta is HTMLTextAreaElement {
  return (
    ta instanceof HTMLTextAreaElement
    && ta.matches(REF_TEXTAREA)
    && !ta.closest(".issue-ref-panel-body")
  );
}

/** Resolve which textarea owns the selection after mouseup (including release outside the field). */
export function refEditableTextareaForSelection(
  target: EventTarget | null,
  selectionDragTa: HTMLTextAreaElement | null = null,
): HTMLTextAreaElement | null {
  if (target instanceof Element) {
    const fromTarget = target.closest("textarea");
    if (isRefEditableTextarea(fromTarget)) return fromTarget;
  }
  const active = document.activeElement;
  if (isRefEditableTextarea(active)) return active;
  if (selectionDragTa && isRefEditableTextarea(selectionDragTa) && selectionDragTa.isConnected) {
    return selectionDragTa;
  }
  return null;
}

function anchorPoint(ta: HTMLTextAreaElement, start: number, end: number, mirror: HTMLDivElement) {
  const rect = ta.getBoundingClientRect();
  const style = getComputedStyle(ta);
  mirror.style.left = `${rect.left}px`;
  mirror.style.top = `${rect.top}px`;
  mirror.style.width = `${rect.width}px`;
  mirror.style.height = `${rect.height}px`;
  mirror.style.overflow = "auto";
  mirror.style.boxSizing = style.boxSizing;
  mirror.style.padding = style.padding;
  mirror.style.border = style.border;
  mirror.style.font = style.font;
  mirror.style.lineHeight = style.lineHeight;
  mirror.style.letterSpacing = style.letterSpacing;
  mirror.scrollTop = ta.scrollTop;
  mirror.replaceChildren();
  mirror.append(document.createTextNode(ta.value.slice(0, start)));
  const mid = document.createElement("span");
  mid.textContent = ta.value.slice(start, end);
  mirror.append(mid, document.createTextNode(ta.value.slice(end)));
  const midRect = mid.getBoundingClientRect();
  if (!midRect.width && !midRect.height) {
    return { x: rect.left + rect.width / 2, y: rect.top };
  }
  return { x: midRect.left + midRect.width / 2, y: midRect.top };
}

export function selectionAnchorFromTextarea(
  ta: HTMLTextAreaElement,
  mirror: HTMLDivElement,
  clientX?: number,
  clientY?: number,
): SelectionAnchor | null {
  const start = ta.selectionStart ?? 0;
  const end = ta.selectionEnd ?? 0;
  if (start === end) return null;
  const label = ta.value.slice(start, end).trim();
  if (!label) return null;
  const anchor = anchorPoint(ta, start, end, mirror);
  const rect = ta.getBoundingClientRect();
  return {
    textarea: ta,
    start,
    end,
    label,
    x: anchor?.x ?? clientX ?? rect.left + rect.width / 2,
    y: anchor?.y ?? clientY ?? rect.top,
  };
}

export function selectionAnchor(
  target: EventTarget | null,
  mirror: HTMLDivElement,
  clientX?: number,
  clientY?: number,
  selectionDragTa: HTMLTextAreaElement | null = null,
): SelectionAnchor | null | undefined {
  const ta = refEditableTextareaForSelection(target, selectionDragTa);
  if (!ta) return undefined;
  return selectionAnchorFromTextarea(ta, mirror, clientX, clientY);
}
