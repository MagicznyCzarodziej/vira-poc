import { parseActionPointIdsInText } from "./actionPointSyntax.ts";
import type { ActionPoint } from "./types.ts";

export type ActionPointBag = {
  nextActionPointId: number;
  actionPoints: Record<string, ActionPoint>;
};

export function recomputeNextActionPointId(actionPoints: Record<string, ActionPoint>): number {
  let max = 0;
  for (const id of Object.keys(actionPoints)) {
    const match = id.match(/^ap-(\d+)$/i);
    if (match) max = Math.max(max, Number.parseInt(match[1] ?? "0", 10));
  }
  return max + 1;
}

export function createActionPoint(bag: ActionPointBag, title = "Action", now = new Date().toISOString()): ActionPoint {
  const id = `ap-${bag.nextActionPointId}`;
  bag.nextActionPointId += 1;
  const ap: ActionPoint = {
    id,
    title: title.trim() || "Action",
    done: false,
    doneAt: null,
    createdAt: now,
  };
  bag.actionPoints[id] = ap;
  return ap;
}

export function toggleActionPointDone(ap: ActionPoint, now = new Date().toISOString()): void {
  ap.done = !ap.done;
  ap.doneAt = ap.done ? now : null;
}

export function hasOpenActionPointRefs(text: string, actionPoints: Record<string, ActionPoint>): boolean {
  for (const id of parseActionPointIdsInText(text)) {
    const ap = actionPoints[id];
    if (ap && !ap.done) return true;
  }
  return false;
}
