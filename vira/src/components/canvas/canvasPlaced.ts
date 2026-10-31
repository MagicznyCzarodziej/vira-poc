import type { DocumentState } from "../../store/documentTypes.ts";

export const CANVAS_PLACED_HOST_SELECTOR = ".canvas-placed-card, .canvas-placed-action-point";

export function canvasPlacedHostFromTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>(CANVAS_PLACED_HOST_SELECTOR);
}

export function canvasPlacedId(host: HTMLElement): string | undefined {
  return host.dataset.canvasPlaced;
}

export function isCanvasActionPointId(state: Pick<DocumentState, "actionPoints">, id: string): boolean {
  return !!state.actionPoints[id];
}

export function canvasWorldPlacement(
  state: Pick<DocumentState, "canvasPlacements" | "actionPointPlacements">,
  id: string,
): { x: number; y: number } | null {
  return state.canvasPlacements[id] ?? state.actionPointPlacements[id] ?? null;
}

export function partitionCanvasMoves(
  state: Pick<DocumentState, "actionPoints">,
  moves: readonly { id: string; x: number; y: number }[],
): {
  cardMoves: { id: string; x: number; y: number }[];
  actionPointMoves: { id: string; x: number; y: number }[];
} {
  const cardMoves: { id: string; x: number; y: number }[] = [];
  const actionPointMoves: { id: string; x: number; y: number }[] = [];
  for (const move of moves) {
    if (isCanvasActionPointId(state, move.id)) actionPointMoves.push(move);
    else cardMoves.push(move);
  }
  return { cardMoves, actionPointMoves };
}
