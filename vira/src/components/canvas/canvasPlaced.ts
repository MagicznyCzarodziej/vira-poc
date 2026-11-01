import type { DocumentState } from "../../store/documentTypes.ts";

export const CANVAS_PLACED_HOST_SELECTOR =
  ".canvas-placed-card, .canvas-placed-action-point, .canvas-placed-frame, .canvas-placed-note";

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

export function isCanvasFrameId(state: Pick<DocumentState, "frames">, id: string): boolean {
  return !!state.frames?.[id];
}

export function isCanvasNoteId(state: Pick<DocumentState, "notes">, id: string): boolean {
  return !!state.notes?.[id];
}

export function isCanvasCardPlacementId(
  state: Pick<DocumentState, "canvasPlacements" | "actionPoints" | "frames" | "notes">,
  id: string,
): boolean {
  return !!state.canvasPlacements[id]
    && !isCanvasActionPointId(state, id)
    && !isCanvasFrameId(state, id)
    && !isCanvasNoteId(state, id);
}

export function canvasWorldPlacement(
  state: Pick<
    DocumentState,
    "canvasPlacements" | "actionPointPlacements" | "framePlacements" | "notePlacements"
  >,
  id: string,
): { x: number; y: number } | null {
  const frame = state.framePlacements[id];
  if (frame) return { x: frame.x, y: frame.y };
  const note = state.notePlacements[id];
  if (note) return { x: note.x, y: note.y };
  return state.canvasPlacements[id] ?? state.actionPointPlacements[id] ?? null;
}

export function partitionCanvasMoves(
  state: Pick<DocumentState, "actionPoints" | "frames" | "notes">,
  moves: readonly { id: string; x: number; y: number }[],
): {
  cardMoves: { id: string; x: number; y: number }[];
  actionPointMoves: { id: string; x: number; y: number }[];
  frameMoves: { id: string; x: number; y: number }[];
  noteMoves: { id: string; x: number; y: number }[];
} {
  const cardMoves: { id: string; x: number; y: number }[] = [];
  const actionPointMoves: { id: string; x: number; y: number }[] = [];
  const frameMoves: { id: string; x: number; y: number }[] = [];
  const noteMoves: { id: string; x: number; y: number }[] = [];
  for (const move of moves) {
    if (isCanvasActionPointId(state, move.id)) actionPointMoves.push(move);
    else if (isCanvasFrameId(state, move.id)) frameMoves.push(move);
    else if (isCanvasNoteId(state, move.id)) noteMoves.push(move);
    else cardMoves.push(move);
  }
  return { cardMoves, actionPointMoves, frameMoves, noteMoves };
}

type CanvasMoveStore = Pick<
  DocumentState,
  "actionPoints" | "frames" | "notes" | "movePlacements" | "moveActionPointPlacements" | "moveFramePlacements" | "moveNotePlacements"
>;

export function commitCanvasGroupMoves(store: CanvasMoveStore, moves: readonly { id: string; x: number; y: number }[]): void {
  const { cardMoves, actionPointMoves, frameMoves, noteMoves } = partitionCanvasMoves(store, moves);
  if (cardMoves.length) store.movePlacements(cardMoves);
  if (actionPointMoves.length) store.moveActionPointPlacements(actionPointMoves);
  if (frameMoves.length) store.moveFramePlacements(frameMoves);
  if (noteMoves.length) store.moveNotePlacements(noteMoves);
}
