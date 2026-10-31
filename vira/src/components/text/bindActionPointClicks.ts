import { requestCanvasReveal } from "../canvas/flyToCard.ts";
import { revealActionPointInList } from "../panels/history/revealCardInList.ts";
import { useDocument } from "../../store/index.ts";
import { decisionActionPointRefContext } from "./actionPointRefContext.ts";

export function navigateToActionPoint(id: string): void {
  const doc = useDocument.getState();
  if (doc.viewMode !== "list") doc.setView("list");
  if (doc.actionPointPlacements[id]) requestCanvasReveal(id);
  revealActionPointInList(id);
}

export function unlinkActionPointRefFromDecision(button: HTMLElement): boolean {
  const id = button.dataset.actionPointId;
  if (!id || button.closest(".card-readonly")) return false;
  const ctx = decisionActionPointRefContext(button);
  if (!ctx) return false;
  return useDocument.getState().unlinkActionPointFromDecision(id, ctx.itemId, ctx.stepIndex);
}

export function bindActionPointClicks(root: HTMLElement): () => void {
  const onClick = (event: MouseEvent) => {
    const unlink = (event.target as Element | null)?.closest?.<HTMLElement>("[data-action='unlink-action-point']");
    if (unlink) {
      event.preventDefault();
      event.stopPropagation();
      unlinkActionPointRefFromDecision(unlink);
      return;
    }
    const button = (event.target as Element | null)?.closest?.<HTMLElement>("[data-action='goto-action-point']");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const id = button.dataset.actionPointId;
    if (id) navigateToActionPoint(id);
  };
  root.addEventListener("click", onClick);
  return () => root.removeEventListener("click", onClick);
}
