let suppressClickUntil = 0;

export function noteListCardDragEnded(): void {
  suppressClickUntil = Date.now() + 400;
}

export function shouldSuppressListCardClick(): boolean {
  return Date.now() < suppressClickUntil;
}

/** Block drag only while typing in a focused field — not on read-only card text chrome. */
export function isListCardDragField(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const field = target.closest("textarea, input, [contenteditable=\"true\"]");
  return field instanceof HTMLElement && document.activeElement === field;
}

/** Click-to-edit surfaces — never start native HTML5 card drag here. */
export function isListCardEditSurface(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest("textarea, input, [data-editable], [contenteditable=\"true\"]");
}

/** Native `<button>` inside a draggable list card captures drag unless default is prevented. */
export function isListCardDragButton(target: EventTarget | null, card: Element): boolean {
  if (!(target instanceof Element)) return false;
  const button = target.closest("button");
  return !!button && card.contains(button);
}
