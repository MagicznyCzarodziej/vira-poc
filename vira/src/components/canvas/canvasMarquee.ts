export type ClientRect = { left: number; top: number; right: number; bottom: number };

export const CANVAS_MARQUEE_THRESHOLD_PX = 4;

export function normalizeClientRect(x1: number, y1: number, x2: number, y2: number): ClientRect {
  return {
    left: Math.min(x1, x2),
    top: Math.min(y1, y2),
    right: Math.max(x1, x2),
    bottom: Math.max(y1, y2),
  };
}

export function clientRectsIntersect(a: ClientRect, b: ClientRect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

export function shouldStartCanvasMarquee(
  startX: number,
  startY: number,
  clientX: number,
  clientY: number,
  thresholdPx = CANVAS_MARQUEE_THRESHOLD_PX,
): boolean {
  const dx = clientX - startX;
  const dy = clientY - startY;
  return dx * dx + dy * dy > thresholdPx * thresholdPx;
}

export function placedIdsInMarquee(surface: HTMLElement, marquee: ClientRect): string[] {
  const ids: string[] = [];
  surface.querySelectorAll<HTMLElement>("[data-canvas-placed]").forEach((el) => {
    const id = el.dataset.canvasPlaced;
    if (!id) return;
    const r = el.getBoundingClientRect();
    const box: ClientRect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    if (clientRectsIntersect(marquee, box)) ids.push(id);
  });
  return ids;
}

/** Viewport-fixed overlay so the box is not clipped by canvas scroll layers. */
export function positionMarqueeElement(el: HTMLElement, marquee: ClientRect): void {
  el.style.left = `${marquee.left}px`;
  el.style.top = `${marquee.top}px`;
  el.style.width = `${Math.max(0, marquee.right - marquee.left)}px`;
  el.style.height = `${Math.max(0, marquee.bottom - marquee.top)}px`;
}
