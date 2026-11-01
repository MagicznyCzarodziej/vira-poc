import type { EditTarget } from "../../store/documentTypes.ts";
import { refPickModeActive } from "../text/bindRefPickFromCard.ts";
import { shouldSuppressListCardClick } from "./listCardDrag.ts";
import { useDocument } from "../../store/index.ts";

export function editTargetFromCanvasPointer(target: EventTarget | null): EditTarget | null {
  if (!(target instanceof Element)) return null;
  if (target.closest("button, [data-action], textarea, input")) return null;
  const el = target.closest<HTMLElement>("[data-editable][data-id]");
  if (!el) return null;
  const field = el.dataset.editable;
  if (field !== "problem" && field !== "answer" && field !== "tags" && field !== "noteBody") return null;
  const id = el.dataset.id;
  if (!id) return null;
  const stepRaw = el.dataset.step;
  const step = stepRaw != null && stepRaw !== "" ? Number(stepRaw) : 0;
  if (field === "noteBody") {
    if (!el.closest(".canvas-placed-note")) return null;
    return {
      id,
      field: "noteBody",
      step: 0,
      surface: "canvas",
    };
  }
  const placementHost = el.closest<HTMLElement>(".canvas-placed-card");
  const canvasPlacementKey = placementHost?.dataset.canvasPlaced;
  if (!canvasPlacementKey) return null;
  return {
    id,
    field,
    step: Number.isFinite(step) ? step : 0,
    surface: "canvas",
    canvasPlacementKey,
  };
}

export function tryBeginCanvasEditFromPointer(target: EventTarget | null): boolean {
  if (shouldSuppressListCardClick() || refPickModeActive()) return false;
  const editTarget = editTargetFromCanvasPointer(target);
  if (!editTarget) return false;
  useDocument.getState().beginEdit(editTarget);
  return true;
}
