export const CANVAS_CARD_DRAG_THRESHOLD_PX = 8;

/** Skip arming a move while the user is typing in a focused field. */
export function isCanvasCardTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const field = target.closest("textarea, input, [contenteditable=\"true\"]");
  return field instanceof HTMLElement && document.activeElement === field;
}

/** Click-to-edit surfaces on a placed card — do not arm canvas drag. */
export function isCanvasCardEditSurface(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest("textarea, input, [data-editable], [contenteditable=\"true\"]");
}

export function shouldStartCanvasCardDrag(
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
  thresholdPx = CANVAS_CARD_DRAG_THRESHOLD_PX,
): boolean {
  const dx = clientX - startX;
  const dy = clientY - startY;
  return dx * dx + dy * dy > thresholdPx * thresholdPx;
}
