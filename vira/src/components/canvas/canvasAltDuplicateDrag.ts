import type { DocumentState } from "../../store/documentTypes.ts";
import { isCanvasActionPointId, isCanvasFrameId } from "./canvasPlaced.ts";

export function cardPlacementKeysInDragGroup(
  state: Pick<DocumentState, "canvasPlacements" | "items" | "actionPoints" | "frames">,
  groupIds: readonly string[],
): string[] {
  return groupIds.filter(
    (id) =>
      !isCanvasActionPointId(state, id)
      && !isCanvasFrameId(state, id)
      && state.canvasPlacements[id] != null,
  );
}

export function remapCanvasDragGroupForAltDuplicate(
  groupIds: readonly string[],
  groupStart: Readonly<Record<string, { x: number; y: number }>>,
  keyMap: Readonly<Record<string, string>>,
): { groupIds: string[]; groupStart: Record<string, { x: number; y: number }> } {
  const nextGroupIds: string[] = [];
  const nextGroupStart: Record<string, { x: number; y: number }> = {};
  for (const gid of groupIds) {
    const mapped = keyMap[gid] ?? gid;
    nextGroupIds.push(mapped);
    const start = groupStart[gid];
    if (start) nextGroupStart[mapped] = { x: start.x, y: start.y };
  }
  return { groupIds: nextGroupIds, groupStart: nextGroupStart };
}
