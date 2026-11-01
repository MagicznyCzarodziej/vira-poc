import type { FrameRect } from "./frameCanvas.ts";
import { localOccluderRectsForFrame } from "./frameBorderOcclusion.ts";

export function frameOccludersLocalById(
  orderedFrameIds: readonly string[],
  framePlacements: Record<string, FrameRect>,
): Map<string, FrameRect[]> {
  const map = new Map<string, FrameRect[]>();
  for (let index = 0; index < orderedFrameIds.length; index += 1) {
    const id = orderedFrameIds[index]!;
    const pos = framePlacements[id];
    if (!pos) continue;
    const hostRect = { x: pos.x, y: pos.y, width: pos.width, height: pos.height };
    const occludersWorld: FrameRect[] = [];
    for (let j = index + 1; j < orderedFrameIds.length; j += 1) {
      const aboveId = orderedFrameIds[j]!;
      const p = framePlacements[aboveId];
      if (p) occludersWorld.push({ x: p.x, y: p.y, width: p.width, height: p.height });
    }
    map.set(id, localOccluderRectsForFrame(hostRect, occludersWorld));
  }
  return map;
}
