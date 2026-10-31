import { clampPlacement } from "../../domain/index.ts";

export function movesForCanvasGroupDrag(
  groupIds: readonly string[],
  groupStart: Readonly<Record<string, { x: number; y: number }>>,
  anchorStart: { x: number; y: number },
  anchorNext: { x: number; y: number },
): { id: string; x: number; y: number }[] {
  const dx = anchorNext.x - anchorStart.x;
  const dy = anchorNext.y - anchorStart.y;
  return groupIds.flatMap((gid) => {
    const start = groupStart[gid];
    if (!start) return [];
    const next = clampPlacement(start.x + dx, start.y + dy);
    return [{ id: gid, x: next.x, y: next.y }];
  });
}
