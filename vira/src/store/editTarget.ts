import type { EditTarget } from "./documentTypes.ts";

export function sameEditTarget(a: EditTarget, b: EditTarget): boolean {
  return (
    a.id === b.id
    && a.field === b.field
    && a.step === b.step
    && a.surface === b.surface
    && (a.canvasPlacementKey ?? null) === (b.canvasPlacementKey ?? null)
  );
}

export function isCanvasPlacementEditing(
  editing: EditTarget | null,
  itemId: string,
  canvasPlacementKey: string | null | undefined,
  field: EditTarget["field"],
  step = 0,
): boolean {
  if (!editing) return false;
  return (
    editing.id === itemId
    && editing.surface === "canvas"
    && editing.field === field
    && editing.step === step
    && (editing.canvasPlacementKey ?? null) === (canvasPlacementKey ?? null)
  );
}
