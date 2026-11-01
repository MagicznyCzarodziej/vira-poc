import { movesForCanvasGroupDrag } from "./canvasGroupDrag.ts";

export function applyCanvasDragTransform(
  root: HTMLElement,
  groupIds: readonly string[],
  groupStart: Readonly<Record<string, { x: number; y: number }>>,
  anchorStart: { x: number; y: number },
  anchorNext: { x: number; y: number },
): void {
  const moves = movesForCanvasGroupDrag(groupIds, groupStart, anchorStart, anchorNext);
  for (const move of moves) {
    const start = groupStart[move.id];
    if (!start) continue;
    const dx = move.x - start.x;
    const dy = move.y - start.y;
    const el = root.querySelector<HTMLElement>(`[data-canvas-placed="${move.id}"]`);
    if (!el) continue;
    el.style.transform = dx || dy ? `translate(${dx}px, ${dy}px)` : "";
  }
}

export function clearCanvasDragTransform(root: HTMLElement, groupIds: readonly string[]): void {
  for (const id of groupIds) {
    const el = root.querySelector<HTMLElement>(`[data-canvas-placed="${id}"]`);
    if (el) el.style.transform = "";
  }
}
