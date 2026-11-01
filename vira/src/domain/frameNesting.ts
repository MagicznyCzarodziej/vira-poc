import type { FramePlacement } from "./types.ts";
import type { FrameRect } from "./frameCanvas.ts";

function pointInsideFrame(px: number, py: number, frame: FrameRect): boolean {
  return (
    px >= frame.x
    && px <= frame.x + frame.width
    && py >= frame.y
    && py <= frame.y + frame.height
  );
}

function frameCenter(placement: FramePlacement): { x: number; y: number } {
  return {
    x: placement.x + placement.width / 2,
    y: placement.y + placement.height / 2,
  };
}

export function framePlacementRect(placement: FramePlacement): FrameRect {
  return {
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
  };
}

export function framePlacementArea(placement: FramePlacement): number {
  return placement.width * placement.height;
}

export function childFrameIds(
  parentId: string,
  framePlacements: Record<string, FramePlacement>,
): string[] {
  return Object.entries(framePlacements)
    .filter(([, p]) => p.parentFrameId === parentId)
    .map(([id]) => id);
}

export function descendantFrameIds(
  rootId: string,
  framePlacements: Record<string, FramePlacement>,
): Set<string> {
  const out = new Set<string>();
  const walk = (id: string) => {
    for (const child of childFrameIds(id, framePlacements)) {
      if (out.has(child)) continue;
      out.add(child);
      walk(child);
    }
  };
  walk(rootId);
  return out;
}

/** Figma-style: nest in the smallest containing frame that is larger than the child. */
export function inferFrameParentId(
  childId: string,
  framePlacements: Record<string, FramePlacement>,
  frames: Record<string, { id: string }>,
): string | null {
  const child = framePlacements[childId];
  if (!child || !frames[childId]) return null;
  const childRect = framePlacementRect(child);
  const childCenter = frameCenter(child);
  const childArea = framePlacementArea(child);
  const blocked = descendantFrameIds(childId, framePlacements);
  blocked.add(childId);

  let best: { id: string; area: number } | null = null;
  for (const [id, placement] of Object.entries(framePlacements)) {
    if (blocked.has(id) || !frames[id]) continue;
    const parentArea = framePlacementArea(placement);
    if (parentArea <= childArea) continue;
    const parentRect = framePlacementRect(placement);
    if (!pointInsideFrame(childCenter.x, childCenter.y, parentRect)) continue;
    if (!best || parentArea < best.area) best = { id, area: parentArea };
  }
  return best?.id ?? null;
}

export function applyInferredFrameParent(
  framePlacements: Record<string, FramePlacement>,
  frames: Record<string, { id: string }>,
  frameId: string,
): void {
  const placement = framePlacements[frameId];
  if (!placement) return;
  placement.parentFrameId = inferFrameParentId(frameId, framePlacements, frames);
}

export function applyInferredFrameParents(
  framePlacements: Record<string, FramePlacement>,
  frames: Record<string, { id: string }>,
  frameIds: readonly string[],
): void {
  for (const id of frameIds) applyInferredFrameParent(framePlacements, frames, id);
}

export function reinferAllFrameParents(
  framePlacements: Record<string, FramePlacement>,
  frames: Record<string, { id: string }>,
): void {
  applyInferredFrameParents(
    framePlacements,
    frames,
    Object.keys(frames).filter((id) => framePlacements[id]),
  );
}

export function clearFrameParentReferences(
  framePlacements: Record<string, FramePlacement>,
  removedId: string,
): string[] {
  const orphaned: string[] = [];
  for (const [id, placement] of Object.entries(framePlacements)) {
    if (placement.parentFrameId === removedId) {
      placement.parentFrameId = null;
      orphaned.push(id);
    }
  }
  return orphaned;
}
